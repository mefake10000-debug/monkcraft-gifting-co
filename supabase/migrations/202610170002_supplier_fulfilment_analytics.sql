-- Supplier checks, fulfilment, Vyapar reconciliation references, and analytics.
-- Apply after 202610170001_moncraft_quote_operations.sql.

create table if not exists public.supplier_checks (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.quote_requests(id) on delete cascade,
  supplier_id uuid references public.supplier_directory(id),
  supplier_name text,
  supplier_category text,
  whatsapp_opt_in_recorded_at_snapshot timestamptz,
  product_lines jsonb not null default '[]'::jsonb,
  total_units integer not null default 0 check (total_units >= 0),
  status text not null default 'Draft' check (status in ('Draft', 'Needs mapping', 'Ready for review', 'Sending', 'Sent', 'Replied', 'Clarification needed', 'Expired', 'Closed')),
  availability text not null default 'Unknown' check (availability in ('Unknown', 'Available', 'Partial', 'Unavailable')),
  quoted_unit_price numeric(12,2),
  moq integer,
  lead_time text,
  reply_text text,
  whatsapp_message_id text,
  whatsapp_approved_by text,
  whatsapp_approved_at timestamptz,
  whatsapp_send_attempted_at timestamptz,
  whatsapp_send_attempted_by text,
  whatsapp_send_error text,
  sent_at timestamptz,
  replied_at timestamptz,
  notion_page_id text,
  notion_sync_status text not null default 'pending' check (notion_sync_status in ('pending', 'synced', 'failed')),
  notion_sync_attempts integer not null default 0,
  notion_sync_after timestamptz not null default now(),
  notion_sync_locked_until timestamptz,
  notion_sync_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists supplier_checks_request_vendor_unique on public.supplier_checks(request_id, supplier_id) where supplier_id is not null;
create unique index if not exists supplier_checks_request_unmapped_unique on public.supplier_checks(request_id) where supplier_id is null;
create index if not exists supplier_checks_supplier_status_idx on public.supplier_checks(supplier_id, status, created_at desc);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  quote_request_id uuid not null unique references public.quote_requests(id),
  status text not null default 'Procurement' check (status in ('Procurement', 'Customization', 'Quality check', 'Dispatch', 'Delivered', 'Closed', 'On hold', 'Cancelled')),
  accepted_quote_version text,
  customer_approved_at timestamptz not null,
  promised_delivery_date date,
  customer_po_reference text,
  vyapar_sales_order_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_milestones (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  stage text not null check (stage in ('Procurement', 'Customization', 'Quality check', 'Dispatch', 'Delivered')),
  status text not null default 'Pending' check (status in ('Pending', 'In progress', 'Blocked', 'Complete')),
  owner text,
  due_at timestamptz,
  completed_at timestamptz,
  evidence_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, stage),
  check (stage <> 'Quality check' or status <> 'Complete' or evidence_url is not null)
);

create table if not exists public.fulfillment_shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  shipment_code text not null unique,
  destination text not null,
  carrier text,
  tracking_reference text,
  status text not null default 'Preparing' check (status in ('Preparing', 'Dispatched', 'In transit', 'Delivered', 'Exception', 'Returned')),
  dispatched_at timestamptz,
  delivered_at timestamptz,
  proof_of_delivery_url text,
  exception_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'Delivered' or (delivered_at is not null and proof_of_delivery_url is not null))
);

create table if not exists public.vyapar_reconciliation (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id),
  quote_request_id uuid references public.quote_requests(id),
  document_type text not null check (document_type in ('Estimate', 'Sales order', 'Invoice', 'Receipt', 'Supplier bill', 'Credit note')),
  vyapar_reference text,
  expected_amount numeric(14,2),
  recorded_amount numeric(14,2),
  status text not null default 'Needs entry' check (status in ('Needs entry', 'Entered in Vyapar', 'Matched', 'Mismatch', 'Needs review')),
  entered_by text,
  document_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (order_id is not null or quote_request_id is not null)
);

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  agent_key text not null check (agent_key in ('prospect_crm', 'marketing_seo', 'sales', 'supplier_whatsapp', 'fulfillment', 'finance_analytics')),
  trigger_name text not null,
  quote_request_id uuid references public.quote_requests(id),
  order_id uuid references public.orders(id),
  input_reference text,
  proposed_action jsonb not null default '{}'::jsonb,
  status text not null default 'Needs review' check (status in ('Proposed', 'Needs review', 'Approved', 'Rejected', 'Completed', 'Failed')),
  human_correction text,
  correction_reason text,
  reviewer text,
  outcome text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.supplier_whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  provider_message_id text not null unique,
  sender_phone text not null,
  supplier_id uuid references public.supplier_directory(id),
  supplier_check_id uuid references public.supplier_checks(id),
  context_message_id text,
  message_type text not null,
  message_text text not null,
  status text not null default 'Needs review' check (status in ('Needs review', 'Matched')),
  received_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewer text
);

alter table public.supplier_checks enable row level security;
alter table public.orders enable row level security;
alter table public.order_milestones enable row level security;
alter table public.fulfillment_shipments enable row level security;
alter table public.vyapar_reconciliation enable row level security;
alter table public.agent_runs enable row level security;
alter table public.supplier_whatsapp_messages enable row level security;
revoke all on public.supplier_checks, public.orders, public.order_milestones, public.fulfillment_shipments, public.vyapar_reconciliation, public.agent_runs, public.supplier_whatsapp_messages from anon, authenticated;
grant all on public.supplier_checks, public.orders, public.order_milestones, public.fulfillment_shipments, public.vyapar_reconciliation, public.agent_runs, public.supplier_whatsapp_messages to service_role;

-- New quote requests now queue supplier-check preparation in the same transaction.
create or replace function public.submit_quote_request(p_client_submission_id text, p_payload jsonb)
returns public.quote_requests
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_request public.quote_requests;
  v_hash text := encode(digest(convert_to(p_payload::text, 'UTF8'), 'sha256'), 'hex');
begin
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'invalid quote payload' using errcode = '22023';
  end if;
  if nullif(trim(p_client_submission_id), '') is not null then
    select * into v_request from public.quote_requests where client_submission_id = trim(p_client_submission_id) for update;
    if found then
      if v_request.payload_hash <> v_hash then raise exception 'submission id reused with different payload' using errcode = '23505'; end if;
      return v_request;
    end if;
  end if;
  insert into public.quote_requests (client_submission_id, payload_hash, payload)
  values (nullif(trim(p_client_submission_id), ''), v_hash, p_payload) returning * into v_request;
  insert into public.automation_outbox (event_type, aggregate_id, payload)
  values
    ('quote_request.notion_sync', v_request.id, jsonb_build_object('request_id', v_request.id)),
    ('quote_request.prepare_supplier_checks', v_request.id, jsonb_build_object('request_id', v_request.id));
  return v_request;
exception when unique_violation then
  select * into v_request from public.quote_requests where client_submission_id = trim(p_client_submission_id);
  if found and v_request.payload_hash = v_hash then return v_request; end if;
  raise;
end;
$$;

create or replace function public.claim_supplier_check_preparation(p_request_id uuid default null)
returns table (outbox_id uuid, request_id uuid)
language plpgsql security definer set search_path = public
as $$
declare v_outbox public.automation_outbox;
begin
  select * into v_outbox from public.automation_outbox o
  where o.event_type = 'quote_request.prepare_supplier_checks'
    and (p_request_id is null or o.aggregate_id = p_request_id)
    and o.next_attempt_at <= now()
    and (o.status = 'pending' or (o.status = 'processing' and o.locked_until < now()))
  order by o.created_at limit 1 for update skip locked;
  if not found then return; end if;
  update public.automation_outbox set status = 'processing', attempts = attempts + 1,
    locked_until = now() + interval '2 minutes', updated_at = now() where id = v_outbox.id;
  return query select v_outbox.id, v_outbox.aggregate_id;
end;
$$;

create or replace function public.finish_supplier_check_preparation(p_outbox_id uuid, p_error text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_outbox public.automation_outbox;
begin
  select * into v_outbox from public.automation_outbox where id = p_outbox_id for update;
  if not found or v_outbox.event_type <> 'quote_request.prepare_supplier_checks' then return; end if;
  if nullif(p_error, '') is null then
    update public.automation_outbox set status = 'done', locked_until = null, last_error = null, updated_at = now() where id = p_outbox_id;
  else
    update public.automation_outbox set status = 'pending', locked_until = null,
      next_attempt_at = now() + make_interval(secs => least(3600, 60 * power(2, least(attempts, 6))::integer)),
      last_error = left(p_error, 300), updated_at = now() where id = p_outbox_id;
  end if;
end;
$$;

-- Build idempotent, human-reviewable RFQ drafts. This function never sends messages.
create or replace function public.prepare_supplier_checks(p_request_id uuid)
returns setof public.supplier_checks
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.quote_requests where id = p_request_id) then
    raise exception 'quote request not found' using errcode = 'P0002';
  end if;

  insert into public.supplier_checks (request_id, supplier_id, supplier_name, supplier_category, whatsapp_opt_in_recorded_at_snapshot, product_lines, total_units, status)
  select p_request_id, s.id, s.display_name, s.category, s.whatsapp_opt_in_recorded_at,
    jsonb_agg(item.value order by item.ordinality),
    sum(case when (item.value->>'quantity') ~ '^[0-9]+$' then (item.value->>'quantity')::integer else 0 end),
    'Draft'
  from public.quote_requests q
  cross join lateral jsonb_array_elements(coalesce(q.payload->'products', '[]'::jsonb)) with ordinality as item(value, ordinality)
  join public.product_supplier_mappings m on m.product_id = item.value->>'id' and m.active
  join public.supplier_directory s on s.id = m.supplier_id and s.active
  where q.id = p_request_id
  group by s.id
  on conflict (request_id, supplier_id) where supplier_id is not null do nothing;

  insert into public.supplier_checks (request_id, supplier_id, supplier_name, supplier_category, product_lines, total_units, status)
  select p_request_id, null, null, null,
    jsonb_agg(item.value order by item.ordinality),
    sum(case when (item.value->>'quantity') ~ '^[0-9]+$' then (item.value->>'quantity')::integer else 0 end),
    'Needs mapping'
  from public.quote_requests q
  cross join lateral jsonb_array_elements(coalesce(q.payload->'products', '[]'::jsonb)) with ordinality as item(value, ordinality)
  left join public.product_supplier_mappings m on m.product_id = item.value->>'id' and m.active
  left join public.supplier_directory s on s.id = m.supplier_id and s.active
  where q.id = p_request_id and s.id is null
  having count(*) > 0
  on conflict (request_id) where supplier_id is null do nothing;

  return query select * from public.supplier_checks where request_id = p_request_id order by created_at, supplier_id nulls last;
end;
$$;

create or replace function public.approve_supplier_check_for_whatsapp(p_check_id uuid, p_reviewer text)
returns setof public.supplier_checks
language plpgsql security definer set search_path = public
as $$
declare v_check public.supplier_checks;
begin
  if nullif(trim(p_reviewer), '') is null then
    raise exception 'reviewer is required' using errcode = '22023';
  end if;
  update public.supplier_checks c set status = 'Ready for review', whatsapp_approved_by = left(trim(p_reviewer), 120),
    whatsapp_approved_at = now(), whatsapp_send_error = null, updated_at = now()
  where c.id = p_check_id and c.supplier_id is not null and c.status in ('Draft', 'Clarification needed')
    and exists (select 1 from public.supplier_directory s where s.id = c.supplier_id and s.active and s.whatsapp_opt_in and s.whatsapp_opt_in_recorded_at is not null and s.phone_e164 is not null)
  returning c.* into v_check;
  if not found then raise exception 'supplier check is not eligible for WhatsApp approval' using errcode = 'P0001'; end if;
  return next v_check;
end;
$$;

create or replace function public.claim_supplier_check_whatsapp_send(p_check_id uuid, p_actor text)
returns table (check_id uuid, request_id uuid, supplier_phone text, check_reference text, request_reference text, products_summary text, total_units integer, requested_delivery_date text)
language plpgsql security definer set search_path = public
as $$
declare v_check public.supplier_checks;
begin
  select c.* into v_check from public.supplier_checks c
  join public.supplier_directory s on s.id = c.supplier_id
  where c.id = p_check_id and c.status = 'Ready for review'
    and s.active and s.whatsapp_opt_in and s.whatsapp_opt_in_recorded_at is not null
    and s.phone_e164 is not null
  for update of c;
  if not found then raise exception 'supplier check is not approved, active, mapped, or opted in' using errcode = 'P0001'; end if;

  update public.supplier_checks set status = 'Sending', whatsapp_send_attempted_at = now(),
    whatsapp_send_attempted_by = left(coalesce(nullif(trim(p_actor), ''), 'operations'), 120),
    whatsapp_send_error = null, updated_at = now() where id = p_check_id;

  return query select v_check.id, v_check.request_id, s.phone_e164,
    upper(substr(v_check.id::text, 1, 8)), upper(substr(v_check.request_id::text, 1, 8)),
    (select string_agg(concat(coalesce(line.value->>'id', line.value->>'name', 'SKU'), case when nullif(line.value->>'quantity', '') is not null then ' × ' || line.value->>'quantity' else '' end), ', ')
      from jsonb_array_elements(v_check.product_lines) line(value)),
    v_check.total_units, coalesce(q.payload->'programme'->>'deliveryDate', 'Please confirm date')
  from public.supplier_directory s join public.quote_requests q on q.id = v_check.request_id
  where s.id = v_check.supplier_id;
end;
$$;

create or replace function public.complete_supplier_check_whatsapp_send(p_check_id uuid, p_provider_message_id text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  update public.supplier_checks set status = 'Sent', whatsapp_message_id = p_provider_message_id,
    sent_at = now(), whatsapp_send_error = null, updated_at = now()
  where id = p_check_id and status = 'Sending' and nullif(p_provider_message_id, '') is not null;
  if not found then raise exception 'send claim is no longer active' using errcode = 'P0001'; end if;
end;
$$;

create or replace function public.fail_supplier_check_whatsapp_send(p_check_id uuid, p_error_code text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  -- Any send failure enters manual review. Network outcomes may be ambiguous;
  -- do not automatically resend and risk a duplicate vendor message.
  update public.supplier_checks set status = 'Clarification needed',
    whatsapp_send_error = left(coalesce(p_error_code, 'send_failed'), 120), updated_at = now()
  where id = p_check_id and status = 'Sending';
end;
$$;

create or replace function public.claim_supplier_check_notion_sync(p_check_id uuid default null)
returns setof public.supplier_checks
language plpgsql security definer set search_path = public
as $$
declare v_check public.supplier_checks;
begin
  select * into v_check from public.supplier_checks c
  where (p_check_id is null or c.id = p_check_id)
    and c.notion_sync_status in ('pending', 'failed')
    and c.notion_sync_after <= now()
    and (c.notion_sync_locked_until is null or c.notion_sync_locked_until < now())
  order by c.created_at limit 1 for update skip locked;
  if not found then return; end if;
  update public.supplier_checks set notion_sync_attempts = notion_sync_attempts + 1,
    notion_sync_locked_until = now() + interval '2 minutes', updated_at = now()
  where id = v_check.id;
  return query select * from public.supplier_checks where id = v_check.id;
end;
$$;

create or replace function public.finish_supplier_check_notion_sync(p_check_id uuid, p_notion_page_id text default null, p_error text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_attempts integer;
begin
  select notion_sync_attempts into v_attempts from public.supplier_checks where id = p_check_id for update;
  if not found then return; end if;
  if nullif(p_notion_page_id, '') is not null then
    update public.supplier_checks set notion_page_id = p_notion_page_id, notion_sync_status = 'synced',
      notion_sync_locked_until = null, notion_sync_error = null, updated_at = now() where id = p_check_id;
  else
    update public.supplier_checks set notion_sync_status = 'failed', notion_sync_locked_until = null,
      notion_sync_after = now() + make_interval(secs => least(3600, 60 * power(2, least(v_attempts, 6))::integer)),
      notion_sync_error = left(coalesce(p_error, 'Notion sync failed'), 300), updated_at = now() where id = p_check_id;
  end if;
end;
$$;

create or replace function public.record_supplier_whatsapp_reply(
  p_provider_message_id text, p_sender_phone text, p_context_message_id text,
  p_message_type text, p_message_text text
)
returns table (stored_message_id uuid, matched_check_id uuid, event_status text, is_duplicate boolean)
language plpgsql security definer set search_path = public
as $$
declare
  v_supplier_id uuid;
  v_check_id uuid;
  v_message_id uuid;
  v_match_count integer;
begin
  if nullif(trim(p_provider_message_id), '') is null or nullif(trim(p_sender_phone), '') is null then
    raise exception 'provider message id and sender are required' using errcode = '22023';
  end if;
  select id into v_supplier_id from public.supplier_directory
  where regexp_replace(coalesce(phone_e164, ''), '[^0-9]', '', 'g') = regexp_replace(p_sender_phone, '[^0-9]', '', 'g')
  limit 1;

  if v_supplier_id is not null and nullif(p_context_message_id, '') is not null then
    select id into v_check_id from public.supplier_checks
      where supplier_id = v_supplier_id and whatsapp_message_id = p_context_message_id limit 1;
  end if;
  if v_supplier_id is not null and v_check_id is null then
    select count(*)::integer, (array_agg(id))[1] into v_match_count, v_check_id
    from (select id from public.supplier_checks where supplier_id = v_supplier_id and status = 'Sent' order by sent_at desc limit 2) open_checks;
    if v_match_count <> 1 then v_check_id := null; end if;
  end if;

  insert into public.supplier_whatsapp_messages (provider_message_id, sender_phone, supplier_id, supplier_check_id, context_message_id, message_type, message_text, status)
  values (p_provider_message_id, p_sender_phone, v_supplier_id, v_check_id, nullif(p_context_message_id, ''), left(p_message_type, 30), left(p_message_text, 4000),
    case when v_check_id is null then 'Needs review' else 'Matched' end)
  on conflict (provider_message_id) do nothing
  returning id into v_message_id;
  if v_message_id is null then
    select id into v_message_id from public.supplier_whatsapp_messages where provider_message_id = p_provider_message_id;
    return query select v_message_id, null::uuid, 'Duplicate'::text, true;
    return;
  end if;

  if v_check_id is not null then
    update public.supplier_checks set status = 'Replied', reply_text = left(p_message_text, 4000), replied_at = now(),
      notion_sync_status = 'pending', notion_sync_after = now(), updated_at = now() where id = v_check_id;
  end if;
  insert into public.agent_runs (agent_key, trigger_name, quote_request_id, input_reference, proposed_action, status)
  values ('supplier_whatsapp', 'supplier_reply_received',
    (select request_id from public.supplier_checks where id = v_check_id),
    coalesce(v_check_id::text, v_supplier_id::text, p_provider_message_id),
    jsonb_build_object('supplier_id', v_supplier_id, 'supplier_check_id', v_check_id,
      'reply_text', left(p_message_text, 4000), 'interpretation', 'Human review required; availability is not inferred.'),
    'Needs review');
  return query select v_message_id, v_check_id,
    case when v_check_id is null then 'Needs review' else 'Matched' end,
    false;
end;
$$;

create or replace view public.business_funnel_daily as
select date_trunc('day', created_at)::date as request_date,
  coalesce(payload->>'source', 'unknown') as source,
  status, count(*)::bigint as request_count
from public.quote_requests
group by 1, 2, 3;

create or replace view public.supplier_response_metrics as
select supplier_id,
  count(*) filter (where sent_at is not null)::bigint as checks_sent,
  count(*) filter (where replied_at is not null)::bigint as checks_replied,
  count(*) filter (where status = 'Needs mapping')::bigint as mapping_exceptions,
  avg(extract(epoch from (replied_at - sent_at)) / 3600.0) filter (where replied_at is not null and sent_at is not null) as avg_response_hours
from public.supplier_checks group by supplier_id;

create or replace view public.fulfillment_health as
select o.id as order_id, o.order_code, o.status as order_status, o.promised_delivery_date,
  count(m.id) filter (where m.status <> 'Complete')::bigint as incomplete_milestones,
  count(m.id) filter (where m.status <> 'Complete' and m.due_at < now())::bigint as overdue_milestones
from public.orders o left join public.order_milestones m on m.order_id = o.id
group by o.id;

revoke all on function public.prepare_supplier_checks(uuid) from public, anon, authenticated;
revoke all on function public.approve_supplier_check_for_whatsapp(uuid, text) from public, anon, authenticated;
revoke all on function public.claim_supplier_check_whatsapp_send(uuid, text) from public, anon, authenticated;
revoke all on function public.complete_supplier_check_whatsapp_send(uuid, text) from public, anon, authenticated;
revoke all on function public.fail_supplier_check_whatsapp_send(uuid, text) from public, anon, authenticated;
revoke all on function public.claim_supplier_check_notion_sync(uuid) from public, anon, authenticated;
revoke all on function public.finish_supplier_check_notion_sync(uuid, text, text) from public, anon, authenticated;
revoke all on function public.record_supplier_whatsapp_reply(text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.prepare_supplier_checks(uuid) to service_role;
grant execute on function public.approve_supplier_check_for_whatsapp(uuid, text) to service_role;
grant execute on function public.claim_supplier_check_whatsapp_send(uuid, text) to service_role;
grant execute on function public.complete_supplier_check_whatsapp_send(uuid, text) to service_role;
grant execute on function public.fail_supplier_check_whatsapp_send(uuid, text) to service_role;
grant execute on function public.claim_supplier_check_notion_sync(uuid) to service_role;
grant execute on function public.finish_supplier_check_notion_sync(uuid, text, text) to service_role;
grant execute on function public.record_supplier_whatsapp_reply(text, text, text, text, text) to service_role;
revoke all on public.business_funnel_daily, public.supplier_response_metrics, public.fulfillment_health from anon, authenticated;
grant select on public.business_funnel_daily, public.supplier_response_metrics, public.fulfillment_health to service_role;
