-- Durable sales ownership, follow-up and activity history.
-- Apply after 202610170003_supplier_reply_review.sql.

update public.quote_requests set status = 'Quote request'
where status is null or status not in ('New', 'Qualified', 'Draft ready', 'Contacted', 'Replied', 'Discovery', 'Quote request', 'Won', 'Lost');

alter table public.quote_requests alter column status set default 'Quote request';
alter table public.quote_requests
  add constraint quote_requests_sales_status_check
  check (status in ('New', 'Qualified', 'Draft ready', 'Contacted', 'Replied', 'Discovery', 'Quote request', 'Won', 'Lost'));
alter table public.quote_requests
  add column owner text,
  add column next_action text,
  add column next_action_at timestamptz,
  add column crm_updated_at timestamptz not null default now();

create index quote_requests_sales_queue_idx on public.quote_requests(status, next_action_at, created_at desc);

create table public.lead_activity_events (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid not null references public.quote_requests(id) on delete cascade,
  event_type text not null check (event_type in ('pipeline_updated', 'note_added')),
  previous_status text,
  new_status text not null,
  owner text,
  next_action text,
  next_action_at timestamptz,
  note text,
  actor text not null,
  occurred_at timestamptz not null default now()
);
create index lead_activity_events_request_idx on public.lead_activity_events(quote_request_id, occurred_at desc);

alter table public.lead_activity_events enable row level security;
revoke all on public.lead_activity_events from anon, authenticated;
grant all on public.lead_activity_events to service_role;

create or replace function public.update_quote_request_pipeline(
  p_request_id uuid,
  p_status text,
  p_owner text default null,
  p_next_action text default null,
  p_next_action_at timestamptz default null,
  p_note text default null,
  p_actor text default null
)
returns setof public.quote_requests
language plpgsql security definer set search_path = public
as $$
declare
  v_request public.quote_requests;
  v_owner text := nullif(left(trim(coalesce(p_owner, '')), 120), '');
  v_next_action text := nullif(left(trim(coalesce(p_next_action, '')), 300), '');
  v_note text := nullif(left(trim(coalesce(p_note, '')), 1000), '');
  v_actor text := nullif(left(trim(coalesce(p_actor, '')), 120), '');
  v_previous_status text;
begin
  if p_status not in ('New', 'Qualified', 'Draft ready', 'Contacted', 'Replied', 'Discovery', 'Quote request', 'Won', 'Lost') then
    raise exception 'invalid sales pipeline status' using errcode = '22023';
  end if;
  if v_actor is null then raise exception 'actor is required' using errcode = '22023'; end if;
  if v_next_action_at is not null and v_next_action is null then
    raise exception 'next action is required when a follow-up date is set' using errcode = '22023';
  end if;

  select * into v_request from public.quote_requests where id = p_request_id for update;
  if not found then raise exception 'quote request not found' using errcode = 'P0002'; end if;
  v_previous_status := v_request.status;

  update public.quote_requests set status = p_status, owner = v_owner,
    next_action = v_next_action, next_action_at = p_next_action_at,
    crm_updated_at = now(), updated_at = now(), notion_sync_status = 'pending'
  where id = p_request_id returning * into v_request;

  insert into public.lead_activity_events (
    quote_request_id, event_type, previous_status, new_status, owner,
    next_action, next_action_at, note, actor
  ) values (
    p_request_id,
    case when v_previous_status <> p_status then 'pipeline_updated'
      when v_note is not null then 'note_added' else 'pipeline_updated' end,
    v_previous_status, p_status,
    v_owner, v_next_action, p_next_action_at, v_note, v_actor
  );

  -- Reuse the unique outbox item. Preserve a live worker lock; its completion
  -- compares crm_updated_at and requeues if it synced an older version.
  update public.automation_outbox set
    status = case when status = 'processing' then status else 'pending' end,
    next_attempt_at = case when status = 'processing' then next_attempt_at else now() end,
    locked_until = case when status = 'processing' then locked_until else null end,
    last_error = null, updated_at = now()
  where event_type = 'quote_request.notion_sync' and aggregate_id = p_request_id;
  if not found then
    insert into public.automation_outbox (event_type, aggregate_id, payload)
    values ('quote_request.notion_sync', p_request_id, jsonb_build_object('request_id', p_request_id))
    on conflict (event_type, aggregate_id) do nothing;
  end if;
  return next v_request;
end;
$$;

create or replace function public.claim_quote_notion_sync_v2(p_request_id uuid default null)
returns table (
  outbox_id uuid, request_id uuid, request_payload jsonb, request_status text,
  owner text, next_action text, next_action_at timestamptz, crm_updated_at timestamptz
)
language plpgsql security definer set search_path = public
as $$
declare v_outbox public.automation_outbox;
begin
  select * into v_outbox from public.automation_outbox o
  where o.event_type = 'quote_request.notion_sync'
    and (p_request_id is null or o.aggregate_id = p_request_id)
    and o.next_attempt_at <= now()
    and (o.status = 'pending' or (o.status = 'processing' and o.locked_until < now()))
  order by o.created_at limit 1 for update skip locked;
  if not found then return; end if;
  update public.automation_outbox set status = 'processing', attempts = attempts + 1,
    locked_until = now() + interval '2 minutes', updated_at = now() where id = v_outbox.id;
  return query select v_outbox.id, q.id, q.payload, q.status, q.owner, q.next_action, q.next_action_at, q.crm_updated_at
    from public.quote_requests q where q.id = v_outbox.aggregate_id;
end;
$$;

create or replace function public.finish_quote_notion_sync_v2(
  p_outbox_id uuid, p_claimed_crm_updated_at timestamptz,
  p_notion_page_id text default null, p_error text default null
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_request_id uuid;
  v_attempts integer;
  v_current_version timestamptz;
begin
  select aggregate_id, attempts into v_request_id, v_attempts from public.automation_outbox
  where id = p_outbox_id and event_type = 'quote_request.notion_sync' for update;
  if not found then return; end if;
  select crm_updated_at into v_current_version from public.quote_requests where id = v_request_id for update;
  if not found then return; end if;

  if nullif(p_notion_page_id, '') is not null then
    update public.quote_requests set notion_page_id = p_notion_page_id,
      notion_sync_status = case when crm_updated_at = p_claimed_crm_updated_at then 'synced' else 'pending' end,
      updated_at = now() where id = v_request_id;
    update public.automation_outbox set
      status = case when v_current_version = p_claimed_crm_updated_at then 'done' else 'pending' end,
      next_attempt_at = now(), locked_until = null, last_error = null, updated_at = now()
      where id = p_outbox_id;
  else
    update public.quote_requests set notion_sync_status = 'failed', updated_at = now() where id = v_request_id;
    update public.automation_outbox set status = 'pending', locked_until = null,
      next_attempt_at = case when v_current_version = p_claimed_crm_updated_at
        then now() + make_interval(secs => least(3600, 60 * power(2, least(v_attempts, 6))::integer))
        else now() end,
      last_error = left(coalesce(p_error, 'Notion sync failed'), 500), updated_at = now()
      where id = p_outbox_id;
  end if;
end;
$$;

revoke all on function public.update_quote_request_pipeline(uuid, text, text, text, timestamptz, text, text) from public, anon, authenticated;
revoke all on function public.claim_quote_notion_sync_v2(uuid) from public, anon, authenticated;
revoke all on function public.finish_quote_notion_sync_v2(uuid, timestamptz, text, text) from public, anon, authenticated;
grant execute on function public.update_quote_request_pipeline(uuid, text, text, text, timestamptz, text, text) to service_role;
grant execute on function public.claim_quote_notion_sync_v2(uuid) to service_role;
grant execute on function public.finish_quote_notion_sync_v2(uuid, timestamptz, text, text) to service_role;
