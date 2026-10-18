-- Accepted-quote order creation and evidence-gated fulfilment workflow.
-- Apply after 202610170004_sales_pipeline.sql.

alter table public.orders add column customer_approval_reference text;
alter table public.orders add column created_by text;
alter table public.orders add column ops_updated_at timestamptz not null default now();
alter table public.orders add column notion_page_id text;
alter table public.orders add column notion_sync_status text not null default 'pending' check (notion_sync_status in ('pending', 'synced', 'failed'));
alter table public.orders add column notion_sync_attempts integer not null default 0;
alter table public.orders add column notion_sync_after timestamptz not null default now();
alter table public.orders add column notion_sync_locked_until timestamptz;
alter table public.orders add column notion_sync_error text;

create table public.order_activity_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  event_type text not null,
  stage text,
  shipment_id uuid,
  previous_status text,
  new_status text,
  details jsonb not null default '{}'::jsonb,
  actor text not null,
  occurred_at timestamptz not null default now()
);
create index order_activity_events_order_idx on public.order_activity_events(order_id, occurred_at desc);
alter table public.order_activity_events enable row level security;
revoke all on public.order_activity_events from anon, authenticated;
grant all on public.order_activity_events to service_role;

create or replace function public.create_order_from_accepted_quote(
  p_quote_request_id uuid,
  p_order_code text,
  p_quote_version text,
  p_customer_approved_at timestamptz,
  p_customer_approval_reference text,
  p_customer_po_reference text default null,
  p_promised_delivery_date date default null,
  p_actor text default null
)
returns setof public.orders
language plpgsql security definer set search_path = public
as $$
declare
  v_request public.quote_requests;
  v_order public.orders;
  v_actor text := nullif(left(trim(coalesce(p_actor, '')), 120), '');
  v_approval_reference text := nullif(left(trim(coalesce(p_customer_approval_reference, '')), 500), '');
  v_quote_version text := nullif(left(trim(coalesce(p_quote_version, '')), 80), '');
  v_order_code text := nullif(left(trim(coalesce(p_order_code, '')), 60), '');
begin
  if v_actor is null or v_approval_reference is null or v_quote_version is null or v_order_code is null then
    raise exception 'order code, accepted quote version, customer approval reference, and actor are required' using errcode = '22023';
  end if;
  if p_customer_approved_at is null or p_customer_approved_at > now() then
    raise exception 'customer approval timestamp is required and cannot be in the future' using errcode = '22023';
  end if;

  select * into v_request from public.quote_requests where id = p_quote_request_id for update;
  if not found then raise exception 'quote request not found' using errcode = 'P0002'; end if;
  if v_request.status <> 'Won' then raise exception 'lead must be marked Won after recorded customer quote acceptance' using errcode = 'P0001'; end if;

  select * into v_order from public.orders where quote_request_id = p_quote_request_id;
  if found then
    if v_order.accepted_quote_version <> v_quote_version
      or v_order.customer_approval_reference <> v_approval_reference
      or v_order.customer_approved_at <> p_customer_approved_at then
      raise exception 'this quote request already has an order with different approval evidence' using errcode = 'P0001';
    end if;
    return next v_order;
    return;
  end if;

  insert into public.orders (
    order_code, quote_request_id, status, accepted_quote_version, customer_approved_at,
    customer_approval_reference, customer_po_reference, promised_delivery_date, created_by
  ) values (
    v_order_code, p_quote_request_id, 'Procurement', v_quote_version, p_customer_approved_at,
    v_approval_reference, nullif(left(trim(coalesce(p_customer_po_reference, '')), 120), ''), p_promised_delivery_date, v_actor
  ) returning * into v_order;

  insert into public.order_milestones (order_id, stage, status, owner)
  values
    (v_order.id, 'Procurement', 'In progress', v_actor),
    (v_order.id, 'Customization', 'Pending', null),
    (v_order.id, 'Quality check', 'Pending', null),
    (v_order.id, 'Dispatch', 'Pending', null),
    (v_order.id, 'Delivered', 'Pending', null);

  insert into public.order_activity_events (order_id, event_type, new_status, details, actor)
  values (v_order.id, 'order_created_after_customer_acceptance', 'Procurement',
    jsonb_build_object('quote_request_id', p_quote_request_id, 'quote_version', v_quote_version,
      'customer_approval_reference', v_approval_reference, 'customer_po_reference', p_customer_po_reference), v_actor);
  return next v_order;
end;
$$;

create or replace function public.update_order_milestone(
  p_order_id uuid,
  p_stage text,
  p_status text,
  p_owner text default null,
  p_due_at timestamptz default null,
  p_evidence_url text default null,
  p_notes text default null,
  p_actor text default null
)
returns setof public.order_milestones
language plpgsql security definer set search_path = public
as $$
declare
  v_order public.orders;
  v_milestone public.order_milestones;
  v_previous_status text;
  v_actor text := nullif(left(trim(coalesce(p_actor, '')), 120), '');
  v_owner text := nullif(left(trim(coalesce(p_owner, '')), 120), '');
  v_evidence text := nullif(left(trim(coalesce(p_evidence_url, '')), 1000), '');
  v_notes text := nullif(left(trim(coalesce(p_notes, '')), 1000), '');
  v_next_stage text;
begin
  if p_stage not in ('Procurement', 'Customization', 'Quality check', 'Dispatch', 'Delivered') then
    raise exception 'invalid order stage' using errcode = '22023';
  end if;
  if p_status not in ('Pending', 'In progress', 'Blocked', 'Complete') then
    raise exception 'invalid milestone status' using errcode = '22023';
  end if;
  if v_actor is null then raise exception 'actor is required' using errcode = '22023'; end if;
  if p_status = 'Blocked' and v_notes is null then raise exception 'a blocker note is required' using errcode = '22023'; end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.status in ('Cancelled', 'Closed') then raise exception 'order is not active' using errcode = 'P0001'; end if;
  select * into v_milestone from public.order_milestones where order_id = p_order_id and stage = p_stage for update;
  if not found then raise exception 'order milestone not found' using errcode = 'P0002'; end if;
  v_previous_status := v_milestone.status;

  if v_previous_status = 'Complete' and p_status <> 'Complete' and (
    exists (select 1 from public.order_milestones later
      where later.order_id = p_order_id
        and array_position(array['Procurement', 'Customization', 'Quality check', 'Dispatch', 'Delivered']::text[], later.stage)
          > array_position(array['Procurement', 'Customization', 'Quality check', 'Dispatch', 'Delivered']::text[], p_stage)
        and later.status <> 'Pending')
    or exists (select 1 from public.fulfillment_shipments s where s.order_id = p_order_id and s.status <> 'Preparing')
  ) then raise exception 'later stages or shipments have started; use an exception review instead of silently reopening this stage' using errcode = 'P0001'; end if;

  if p_status = 'Complete' then
    if p_stage in ('Quality check', 'Dispatch') and v_evidence is null then
      raise exception 'evidence is required to complete quality check or dispatch' using errcode = '22023';
    end if;
    if p_stage = 'Delivered' and not exists (
      select 1 from public.fulfillment_shipments s where s.order_id = p_order_id and s.status = 'Delivered'
        and s.delivered_at is not null and s.proof_of_delivery_url is not null
    ) then raise exception 'delivery requires shipment and proof-of-delivery evidence' using errcode = 'P0001'; end if;
    if p_stage <> 'Procurement' and not exists (
      select 1 from public.order_milestones previous
      where previous.order_id = p_order_id
        and previous.stage = case p_stage
          when 'Customization' then 'Procurement'
          when 'Quality check' then 'Customization'
          when 'Dispatch' then 'Quality check'
          when 'Delivered' then 'Dispatch' end
        and previous.status = 'Complete'
    ) then raise exception 'complete the previous fulfilment stage first' using errcode = 'P0001'; end if;
  end if;

  update public.order_milestones set status = p_status, owner = v_owner,
    due_at = p_due_at, evidence_url = v_evidence, notes = v_notes,
    completed_at = case when p_status = 'Complete' then now() else null end, updated_at = now()
  where id = v_milestone.id returning * into v_milestone;

  select stage into v_next_stage from public.order_milestones
  where order_id = p_order_id and status <> 'Complete'
  order by array_position(array['Procurement', 'Customization', 'Quality check', 'Dispatch', 'Delivered']::text[], stage)
  limit 1;
  update public.orders set status = case
    when v_next_stage is null then 'Delivered'
    when v_next_stage = 'Delivered' then 'Dispatch'
    else v_next_stage end,
    ops_updated_at = now(), notion_sync_status = 'pending', notion_sync_after = now(),
    updated_at = now() where id = p_order_id;
  insert into public.order_activity_events (order_id, event_type, stage, previous_status, new_status, details, actor)
  values (p_order_id, 'milestone_updated', p_stage, v_previous_status, p_status,
    jsonb_build_object('owner', v_owner, 'due_at', p_due_at, 'evidence_url', v_evidence, 'notes', v_notes), v_actor);
  return next v_milestone;
end;
$$;

create or replace function public.create_fulfillment_shipment(
  p_order_id uuid,
  p_shipment_code text,
  p_destination text,
  p_carrier text default null,
  p_tracking_reference text default null,
  p_actor text default null
)
returns setof public.fulfillment_shipments
language plpgsql security definer set search_path = public
as $$
declare
  v_order public.orders;
  v_shipment public.fulfillment_shipments;
  v_actor text := nullif(left(trim(coalesce(p_actor, '')), 120), '');
begin
  if nullif(trim(coalesce(p_shipment_code, '')), '') is null or nullif(trim(coalesce(p_destination, '')), '') is null or v_actor is null then
    raise exception 'shipment code, destination, and actor are required' using errcode = '22023';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.status in ('Cancelled', 'Closed', 'Delivered') then raise exception 'order is not eligible for a new shipment' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.order_milestones where order_id = p_order_id and stage = 'Quality check' and status = 'Complete') then
    raise exception 'quality check must pass before creating a shipment' using errcode = 'P0001';
  end if;
  insert into public.fulfillment_shipments (order_id, shipment_code, destination, carrier, tracking_reference)
  values (p_order_id, left(trim(p_shipment_code), 60), left(trim(p_destination), 500),
    nullif(left(trim(coalesce(p_carrier, '')), 120), ''), nullif(left(trim(coalesce(p_tracking_reference, '')), 200), ''))
  returning * into v_shipment;
  insert into public.order_activity_events (order_id, event_type, shipment_id, new_status, details, actor)
  values (p_order_id, 'shipment_created', v_shipment.id, 'Preparing',
    jsonb_build_object('shipment_code', v_shipment.shipment_code, 'destination', v_shipment.destination), v_actor);
  update public.orders set ops_updated_at = now(), notion_sync_status = 'pending', notion_sync_after = now(), updated_at = now()
    where id = p_order_id;
  return next v_shipment;
end;
$$;

create or replace function public.update_fulfillment_shipment(
  p_shipment_id uuid,
  p_status text,
  p_carrier text default null,
  p_tracking_reference text default null,
  p_dispatched_at timestamptz default null,
  p_delivered_at timestamptz default null,
  p_proof_of_delivery_url text default null,
  p_exception_notes text default null,
  p_actor text default null
)
returns setof public.fulfillment_shipments
language plpgsql security definer set search_path = public
as $$
declare
  v_shipment public.fulfillment_shipments;
  v_previous_status text;
  v_actor text := nullif(left(trim(coalesce(p_actor, '')), 120), '');
  v_proof text := nullif(left(trim(coalesce(p_proof_of_delivery_url, '')), 1000), '');
  v_exception text := nullif(left(trim(coalesce(p_exception_notes, '')), 1000), '');
begin
  if p_status not in ('Preparing', 'Dispatched', 'In transit', 'Delivered', 'Exception', 'Returned') then
    raise exception 'invalid shipment status' using errcode = '22023';
  end if;
  if v_actor is null then raise exception 'actor is required' using errcode = '22023'; end if;
  select * into v_shipment from public.fulfillment_shipments where id = p_shipment_id for update;
  if not found then raise exception 'shipment not found' using errcode = 'P0002'; end if;
  v_previous_status := v_shipment.status;

  if p_status <> v_previous_status and not (
    (v_previous_status = 'Preparing' and p_status = 'Dispatched') or
    (v_previous_status = 'Dispatched' and p_status in ('In transit', 'Delivered')) or
    (v_previous_status = 'In transit' and p_status = 'Delivered') or
    (p_status = 'Exception' and v_previous_status not in ('Returned', 'Delivered')) or
    (v_previous_status = 'Exception' and p_status in ('In transit', 'Delivered', 'Returned'))
  ) then raise exception 'invalid shipment state transition' using errcode = 'P0001'; end if;
  if p_status in ('Dispatched', 'Delivered') and not exists (
    select 1 from public.order_milestones where order_id = v_shipment.order_id and stage = 'Dispatch' and status = 'Complete'
  ) then raise exception 'dispatch milestone must be completed with evidence before shipment dispatch' using errcode = 'P0001'; end if;
  if p_status = 'Delivered' and (p_delivered_at is null or p_delivered_at > now() or v_proof is null) then
    raise exception 'delivered shipments require a past delivery time and proof-of-delivery evidence' using errcode = '22023';
  end if;
  if p_status = 'Exception' and v_exception is null then raise exception 'shipment exception details are required' using errcode = '22023'; end if;

  update public.fulfillment_shipments set status = p_status,
    carrier = coalesce(nullif(left(trim(coalesce(p_carrier, '')), 120), ''), carrier),
    tracking_reference = coalesce(nullif(left(trim(coalesce(p_tracking_reference, '')), 200), ''), tracking_reference),
    dispatched_at = case when p_status = 'Dispatched' then coalesce(p_dispatched_at, now()) else dispatched_at end,
    delivered_at = case when p_status = 'Delivered' then p_delivered_at else delivered_at end,
    proof_of_delivery_url = case when p_status = 'Delivered' then v_proof else proof_of_delivery_url end,
    exception_notes = case when p_status = 'Exception' then v_exception else exception_notes end,
    updated_at = now()
  where id = p_shipment_id returning * into v_shipment;

  insert into public.order_activity_events (order_id, event_type, stage, shipment_id, previous_status, new_status, details, actor)
  values (v_shipment.order_id, 'shipment_updated', 'Dispatch', v_shipment.id, v_previous_status, p_status,
    jsonb_build_object('carrier', v_shipment.carrier, 'tracking_reference', v_shipment.tracking_reference,
      'proof_of_delivery_url', v_shipment.proof_of_delivery_url, 'exception_notes', v_shipment.exception_notes), v_actor);

  update public.orders set
    status = case when p_status = 'Delivered' and not exists (
      select 1 from public.fulfillment_shipments where order_id = v_shipment.order_id and status <> 'Delivered'
    ) then 'Delivered' else status end,
    ops_updated_at = now(), notion_sync_status = 'pending', notion_sync_after = now(), updated_at = now()
  where id = v_shipment.order_id;

  if p_status = 'Delivered' and not exists (
    select 1 from public.fulfillment_shipments where order_id = v_shipment.order_id and status <> 'Delivered'
  ) then
    update public.order_milestones set status = 'Complete', completed_at = coalesce(completed_at, now()),
      evidence_url = v_proof, updated_at = now()
      where order_id = v_shipment.order_id and stage = 'Delivered';
  end if;
  return next v_shipment;
end;
$$;

create or replace function public.claim_order_notion_sync(p_order_id uuid default null)
returns table (
  order_id uuid, order_code text, quote_request_id uuid, order_status text,
  accepted_quote_version text, customer_approved_at timestamptz, customer_approval_reference text,
  customer_po_reference text, promised_delivery_date date, ops_updated_at timestamptz,
  notion_attempts integer, request_payload jsonb
)
language plpgsql security definer set search_path = public
as $$
declare v_order public.orders;
begin
  select * into v_order from public.orders o
  where (p_order_id is null or o.id = p_order_id)
    and o.notion_sync_status in ('pending', 'failed')
    and o.notion_sync_after <= now()
    and (o.notion_sync_locked_until is null or o.notion_sync_locked_until < now())
  order by o.created_at limit 1 for update skip locked;
  if not found then return; end if;
  update public.orders set notion_sync_attempts = notion_sync_attempts + 1,
    notion_sync_locked_until = now() + interval '2 minutes' where id = v_order.id;
  return query select v_order.id, v_order.order_code, v_order.quote_request_id, v_order.status,
    v_order.accepted_quote_version, v_order.customer_approved_at, v_order.customer_approval_reference,
    v_order.customer_po_reference, v_order.promised_delivery_date, v_order.ops_updated_at,
    v_order.notion_sync_attempts + 1, q.payload
    from public.quote_requests q where q.id = v_order.quote_request_id;
end;
$$;

create or replace function public.finish_order_notion_sync(
  p_order_id uuid, p_claimed_ops_updated_at timestamptz,
  p_notion_page_id text default null, p_error text default null
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then return; end if;
  if nullif(p_notion_page_id, '') is not null then
    update public.orders set notion_page_id = p_notion_page_id,
      notion_sync_status = case when ops_updated_at = p_claimed_ops_updated_at then 'synced' else 'pending' end,
      notion_sync_after = now(), notion_sync_locked_until = null, notion_sync_error = null, updated_at = now()
      where id = p_order_id;
  else
    update public.orders set notion_sync_status = 'failed', notion_sync_locked_until = null,
      notion_sync_after = case when ops_updated_at = p_claimed_ops_updated_at
        then now() + make_interval(secs => least(3600, 60 * power(2, least(notion_sync_attempts, 6))::integer))
        else now() end,
      notion_sync_error = left(coalesce(p_error, 'Notion order sync failed'), 500), updated_at = now()
      where id = p_order_id;
  end if;
end;
$$;

revoke all on function public.create_order_from_accepted_quote(uuid, text, text, timestamptz, text, text, date, text) from public, anon, authenticated;
revoke all on function public.update_order_milestone(uuid, text, text, text, timestamptz, text, text, text) from public, anon, authenticated;
revoke all on function public.create_fulfillment_shipment(uuid, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.update_fulfillment_shipment(uuid, text, text, text, timestamptz, timestamptz, text, text, text) from public, anon, authenticated;
revoke all on function public.claim_order_notion_sync(uuid) from public, anon, authenticated;
revoke all on function public.finish_order_notion_sync(uuid, timestamptz, text, text) from public, anon, authenticated;
grant execute on function public.create_order_from_accepted_quote(uuid, text, text, timestamptz, text, text, date, text) to service_role;
grant execute on function public.update_order_milestone(uuid, text, text, text, timestamptz, text, text, text) to service_role;
grant execute on function public.create_fulfillment_shipment(uuid, text, text, text, text, text) to service_role;
grant execute on function public.update_fulfillment_shipment(uuid, text, text, text, timestamptz, timestamptz, text, text, text) to service_role;
grant execute on function public.claim_order_notion_sync(uuid) to service_role;
grant execute on function public.finish_order_notion_sync(uuid, timestamptz, text, text) to service_role;
