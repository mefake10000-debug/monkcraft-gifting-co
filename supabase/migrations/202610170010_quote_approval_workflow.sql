-- Versioned manual quote drafts with review, send, and buyer-acceptance gates.

create table public.quote_versions (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid not null references public.quote_requests(id),
  version integer not null check (version > 0),
  status text not null default 'Draft' check (status in ('Draft', 'Changes requested', 'Approval requested', 'Approved', 'Sent', 'Accepted', 'Declined', 'Superseded')),
  snapshot jsonb not null,
  subtotal_paise bigint not null check (subtotal_paise >= 0),
  total_paise bigint not null check (total_paise >= 0),
  terms text not null default '',
  valid_until date,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_by text,
  approved_at timestamptz,
  sent_at timestamptz,
  sent_evidence_reference text,
  buyer_decision_at timestamptz,
  buyer_decision_reference text,
  notion_sync_status text not null default 'pending' check (notion_sync_status in ('pending', 'synced', 'failed')),
  notion_page_id text,
  notion_synced_at timestamptz,
  notion_attempts integer not null default 0,
  notion_next_attempt_at timestamptz not null default now(),
  notion_locked_until timestamptz,
  notion_last_error text,
  unique (quote_request_id, version)
);
create unique index quote_versions_one_open_per_request_idx on public.quote_versions(quote_request_id)
  where status in ('Draft', 'Changes requested', 'Approval requested', 'Approved');
create index quote_versions_request_history_idx on public.quote_versions(quote_request_id, version desc);

create table public.quote_version_events (
  id uuid primary key default gen_random_uuid(),
  quote_version_id uuid not null references public.quote_versions(id),
  quote_request_id uuid not null references public.quote_requests(id),
  event_type text not null check (event_type in ('draft_created', 'draft_updated', 'approval_requested', 'approved', 'changes_requested', 'sent', 'accepted', 'declined', 'superseded')),
  previous_status text,
  new_status text not null,
  actor text not null,
  evidence_reference text,
  note text,
  occurred_at timestamptz not null default now()
);
create index quote_version_events_history_idx on public.quote_version_events(quote_version_id, occurred_at desc);

create or replace function public.claim_quote_version_notion_sync(p_quote_version_id uuid default null)
returns setof public.quote_versions
language plpgsql security definer set search_path = public
as $$
declare v_quote public.quote_versions;
begin
  select * into v_quote from public.quote_versions
  where (p_quote_version_id is null or id = p_quote_version_id)
    and notion_sync_status in ('pending', 'failed') and notion_next_attempt_at <= now()
    and (notion_locked_until is null or notion_locked_until < now())
  order by updated_at asc limit 1 for update skip locked;
  if not found then return; end if;
  update public.quote_versions set notion_attempts = notion_attempts + 1,
    notion_locked_until = now() + interval '3 minutes' where id = v_quote.id returning * into v_quote;
  return next v_quote;
end;
$$;

create or replace function public.finish_quote_version_notion_sync(
  p_quote_version_id uuid, p_claimed_updated_at timestamptz, p_notion_page_id text default null, p_error text default null
)
returns setof public.quote_versions
language plpgsql security definer set search_path = public
as $$
declare v_quote public.quote_versions;
begin
  select * into v_quote from public.quote_versions where id = p_quote_version_id for update;
  if not found then return; end if;
  if v_quote.updated_at <> p_claimed_updated_at then
    update public.quote_versions set notion_sync_status = 'pending', notion_next_attempt_at = now(), notion_locked_until = null
      where id = p_quote_version_id returning * into v_quote;
  elsif nullif(trim(coalesce(p_error, '')), '') is null and nullif(trim(coalesce(p_notion_page_id, '')), '') is not null then
    update public.quote_versions set notion_sync_status = 'synced', notion_page_id = p_notion_page_id,
      notion_synced_at = now(), notion_locked_until = null, notion_last_error = null
      where id = p_quote_version_id returning * into v_quote;
  else
    update public.quote_versions set notion_sync_status = 'failed', notion_locked_until = null,
      notion_last_error = left(coalesce(p_error, 'Notion did not return a page ID'), 400),
      notion_next_attempt_at = now() + make_interval(secs => least(3600, power(2, least(notion_attempts, 10))::integer * 15))
      where id = p_quote_version_id returning * into v_quote;
  end if;
  return next v_quote;
end;
$$;

alter table public.quote_versions enable row level security;
alter table public.quote_version_events enable row level security;
revoke all on public.quote_versions, public.quote_version_events from anon, authenticated;
grant all on public.quote_versions, public.quote_version_events to service_role;

create or replace function public.save_quote_draft(
  p_quote_request_id uuid, p_quote_version_id uuid, p_snapshot jsonb, p_terms text, p_valid_until date, p_actor text
)
returns setof public.quote_versions
language plpgsql security definer set search_path = public
as $$
declare
  v_request public.quote_requests;
  v_quote public.quote_versions;
  v_before_status text;
  v_actor text := nullif(left(trim(coalesce(p_actor, '')), 120), '');
  v_lines jsonb := p_snapshot->'lines';
  v_adjustments jsonb := coalesce(p_snapshot->'adjustments', '[]'::jsonb);
  v_subtotal numeric := 0;
  v_adjustment numeric := 0;
  v_item jsonb;
  v_quantity integer;
  v_unit bigint;
  v_total numeric;
  v_version integer;
begin
  if v_actor is null or p_snapshot is null or jsonb_typeof(p_snapshot) <> 'object'
    or jsonb_typeof(v_lines) is distinct from 'array' or jsonb_array_length(v_lines) < 1 or jsonb_array_length(v_lines) > 100
    or jsonb_typeof(v_adjustments) is distinct from 'array' or jsonb_array_length(v_adjustments) > 20 then
    raise exception 'invalid quote draft' using errcode = '22023';
  end if;
  select * into v_request from public.quote_requests where id = p_quote_request_id for update;
  if not found then raise exception 'quote request not found' using errcode = 'P0002'; end if;
  if v_request.status = 'Lost' then raise exception 'cannot quote a lost request' using errcode = '22023'; end if;

  for v_item in select value from jsonb_array_elements(v_lines) loop
    if nullif(trim(coalesce(v_item->>'productId', '')), '') is null
      or nullif(trim(coalesce(v_item->>'description', '')), '') is null
      or coalesce(v_item->>'quantity', '') !~ '^[1-9][0-9]{0,6}$'
      or coalesce(v_item->>'unitPricePaise', '') !~ '^(0|[1-9][0-9]{0,12})$' then
      raise exception 'quote line needs an item, description, positive quantity, and integer price in paise' using errcode = '22023';
    end if;
    v_quantity := (v_item->>'quantity')::integer;
    v_unit := (v_item->>'unitPricePaise')::bigint;
    v_subtotal := v_subtotal + v_quantity::numeric * v_unit::numeric;
  end loop;
  for v_item in select value from jsonb_array_elements(v_adjustments) loop
    if nullif(trim(coalesce(v_item->>'label', '')), '') is null
      or coalesce(v_item->>'amountPaise', '') !~ '^-?(0|[1-9][0-9]{0,12})$' then
      raise exception 'quote adjustments require a label and integer amount in paise' using errcode = '22023';
    end if;
    v_adjustment := v_adjustment + (v_item->>'amountPaise')::numeric;
  end loop;
  v_total := v_subtotal + v_adjustment;
  if v_subtotal > 9000000000000 or v_total < 0 or v_total > 9000000000000 then
    raise exception 'quote amount is outside the supported range' using errcode = '22023';
  end if;
  if coalesce((p_snapshot->>'subtotalPaise')::numeric, -1) <> v_subtotal
    or coalesce((p_snapshot->>'totalPaise')::numeric, -1) <> v_total then
    raise exception 'quote totals do not match line prices and adjustments' using errcode = '22023';
  end if;

  if p_quote_version_id is null then
    if exists (select 1 from public.quote_versions where quote_request_id = p_quote_request_id and status in ('Draft', 'Changes requested', 'Approval requested', 'Approved')) then
      raise exception 'resolve the current quote version before creating another draft' using errcode = '23505';
    end if;
    select coalesce(max(version), 0) + 1 into v_version from public.quote_versions where quote_request_id = p_quote_request_id;
    insert into public.quote_versions (quote_request_id, version, snapshot, subtotal_paise, total_paise, terms, valid_until, created_by)
      values (p_quote_request_id, v_version, p_snapshot, v_subtotal::bigint, v_total::bigint,
        left(coalesce(p_terms, ''), 4000), p_valid_until, v_actor) returning * into v_quote;
    insert into public.quote_version_events (quote_version_id, quote_request_id, event_type, new_status, actor)
      values (v_quote.id, p_quote_request_id, 'draft_created', 'Draft', v_actor);
  else
    select * into v_quote from public.quote_versions where id = p_quote_version_id and quote_request_id = p_quote_request_id for update;
    if not found then raise exception 'quote version not found' using errcode = 'P0002'; end if;
    if v_quote.status not in ('Draft', 'Changes requested') then raise exception 'only a draft or changes-requested quote can be edited' using errcode = '22023'; end if;
    v_before_status := v_quote.status;
    update public.quote_versions set status = 'Draft', snapshot = p_snapshot, subtotal_paise = v_subtotal::bigint,
      total_paise = v_total::bigint, terms = left(coalesce(p_terms, ''), 4000), valid_until = p_valid_until,
      updated_at = now(), notion_sync_status = 'pending', notion_next_attempt_at = now(), notion_locked_until = null, notion_last_error = null
      where id = p_quote_version_id returning * into v_quote;
    insert into public.quote_version_events (quote_version_id, quote_request_id, event_type, previous_status, new_status, actor)
      values (v_quote.id, p_quote_request_id, 'draft_updated', v_before_status, 'Draft', v_actor);
  end if;
  return next v_quote;
end;
$$;

create or replace function public.transition_quote_version(
  p_quote_version_id uuid, p_action text, p_actor text, p_evidence_reference text default null, p_note text default null
)
returns setof public.quote_versions
language plpgsql security definer set search_path = public
as $$
declare
  v_quote public.quote_versions;
  v_request public.quote_requests;
  v_previous_status text;
  v_next_status text;
  v_event_type text;
  v_actor text := nullif(left(trim(coalesce(p_actor, '')), 120), '');
  v_evidence text := nullif(left(trim(coalesce(p_evidence_reference, '')), 500), '');
  v_note text := nullif(left(trim(coalesce(p_note, '')), 1000), '');
begin
  if v_actor is null then raise exception 'actor is required' using errcode = '22023'; end if;
  if p_action not in ('submit_for_approval', 'approve', 'request_changes', 'mark_sent', 'accept', 'decline') then
    raise exception 'invalid quote action' using errcode = '22023';
  end if;
  if p_action in ('mark_sent', 'accept', 'decline') and v_evidence is null then
    raise exception 'communication evidence reference is required' using errcode = '22023';
  end if;
  if p_action = 'request_changes' and v_note is null then raise exception 'change request note is required' using errcode = '22023'; end if;
  select * into v_quote from public.quote_versions where id = p_quote_version_id for update;
  if not found then raise exception 'quote version not found' using errcode = 'P0002'; end if;
  select * into v_request from public.quote_requests where id = v_quote.quote_request_id for update;
  if not found then raise exception 'quote request not found' using errcode = 'P0002'; end if;
  v_previous_status := v_quote.status;
  if p_action = 'submit_for_approval' and v_quote.status in ('Draft', 'Changes requested') then
    v_next_status := 'Approval requested'; v_event_type := 'approval_requested';
  elsif p_action = 'approve' and v_quote.status = 'Approval requested' then
    v_next_status := 'Approved'; v_event_type := 'approved';
  elsif p_action = 'request_changes' and v_quote.status = 'Approval requested' then
    v_next_status := 'Changes requested'; v_event_type := 'changes_requested';
  elsif p_action = 'mark_sent' and v_quote.status = 'Approved' then
    v_next_status := 'Sent'; v_event_type := 'sent';
  elsif p_action = 'accept' and v_quote.status = 'Sent' then
    if v_quote.valid_until is not null and v_quote.valid_until < current_date then
      raise exception 'expired quote cannot be accepted; issue a reviewed version' using errcode = '22023';
    end if;
    v_next_status := 'Accepted'; v_event_type := 'accepted';
  elsif p_action = 'decline' and v_quote.status = 'Sent' then
    v_next_status := 'Declined'; v_event_type := 'declined';
  else
    raise exception 'quote action is not allowed from current status %', v_quote.status using errcode = '22023';
  end if;

  update public.quote_versions set status = v_next_status, updated_at = now(),
    approved_by = case when p_action = 'approve' then v_actor else approved_by end,
    approved_at = case when p_action = 'approve' then now() else approved_at end,
    sent_at = case when p_action = 'mark_sent' then now() else sent_at end,
    sent_evidence_reference = case when p_action = 'mark_sent' then v_evidence else sent_evidence_reference end,
    buyer_decision_at = case when p_action in ('accept', 'decline') then now() else buyer_decision_at end,
    buyer_decision_reference = case when p_action in ('accept', 'decline') then v_evidence else buyer_decision_reference end,
    notion_sync_status = 'pending', notion_next_attempt_at = now(), notion_locked_until = null, notion_last_error = null
    where id = p_quote_version_id returning * into v_quote;
  if p_action = 'mark_sent' then
    with superseded as (
      update public.quote_versions set status = 'Superseded', updated_at = now(), notion_sync_status = 'pending', notion_next_attempt_at = now()
        where quote_request_id = v_quote.quote_request_id and id <> v_quote.id and status = 'Sent'
        returning id, quote_request_id
    )
    insert into public.quote_version_events (quote_version_id, quote_request_id, event_type, previous_status, new_status, actor, evidence_reference)
      select id, quote_request_id, 'superseded', 'Sent', 'Superseded', v_actor, v_evidence from superseded;
  elsif p_action = 'accept' then
    update public.quote_requests set status = 'Won', crm_updated_at = now(), updated_at = now(), notion_sync_status = 'pending'
      where id = v_quote.quote_request_id;
    insert into public.lead_activity_events (quote_request_id, event_type, previous_status, new_status, note, actor)
      values (v_quote.quote_request_id, 'pipeline_updated', v_request.status, 'Won', 'Accepted quote version v' || v_quote.version::text, v_actor);
    update public.automation_outbox set status = case when status = 'processing' then status else 'pending' end,
      next_attempt_at = case when status = 'processing' then next_attempt_at else now() end,
      locked_until = case when status = 'processing' then locked_until else null end,
      last_error = null, updated_at = now()
      where event_type = 'quote_request.notion_sync' and aggregate_id = v_quote.quote_request_id;
    if not found then
      insert into public.automation_outbox(event_type, aggregate_id, payload)
        values ('quote_request.notion_sync', v_quote.quote_request_id, jsonb_build_object('request_id', v_quote.quote_request_id))
        on conflict (event_type, aggregate_id) do nothing;
    end if;
  end if;
  insert into public.quote_version_events (quote_version_id, quote_request_id, event_type, previous_status, new_status, actor, evidence_reference, note)
    values (v_quote.id, v_quote.quote_request_id, v_event_type, v_previous_status, v_next_status, v_actor, v_evidence, v_note);
  return next v_quote;
end;
$$;

-- Order creation must reference the quote version the buyer actually accepted.
create or replace function public.require_accepted_quote_for_order()
returns trigger language plpgsql security definer set search_path = public
as $$
declare v_version integer;
begin
  if new.accepted_quote_version !~* '^v?[1-9][0-9]*$' then raise exception 'accepted quote version must be a version number such as v1' using errcode = '22023'; end if;
  v_version := regexp_replace(new.accepted_quote_version, '^[vV]', '')::integer;
  if not exists (select 1 from public.quote_versions q where q.quote_request_id = new.quote_request_id and q.version = v_version and q.status = 'Accepted') then
    raise exception 'order requires the quote version recorded as accepted' using errcode = '22023';
  end if;
  return new;
end;
$$;
create trigger orders_require_accepted_quote_trigger before insert on public.orders
  for each row execute function public.require_accepted_quote_for_order();

-- A CRM status update must not bypass the quote acceptance workflow.
create or replace function public.require_accepted_quote_for_won_lead()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.status = 'Won' and old.status is distinct from 'Won'
    and not exists (
      select 1 from public.quote_versions q
      where q.quote_request_id = new.id and q.status = 'Accepted'
    ) then
    raise exception 'a lead can be marked Won only after a quote version is accepted' using errcode = '22023';
  end if;
  return new;
end;
$$;
create trigger quote_requests_require_accepted_quote_trigger
  before update of status on public.quote_requests
  for each row execute function public.require_accepted_quote_for_won_lead();

revoke all on function public.save_quote_draft(uuid, uuid, jsonb, text, date, text) from public, anon, authenticated;
revoke all on function public.transition_quote_version(uuid, text, text, text, text) from public, anon, authenticated;
revoke all on function public.claim_quote_version_notion_sync(uuid) from public, anon, authenticated;
revoke all on function public.finish_quote_version_notion_sync(uuid, timestamptz, text, text) from public, anon, authenticated;
revoke all on function public.require_accepted_quote_for_order() from public, anon, authenticated;
revoke all on function public.require_accepted_quote_for_won_lead() from public, anon, authenticated;
grant execute on function public.save_quote_draft(uuid, uuid, jsonb, text, date, text) to service_role;
grant execute on function public.transition_quote_version(uuid, text, text, text, text) to service_role;
grant execute on function public.claim_quote_version_notion_sync(uuid) to service_role;
grant execute on function public.finish_quote_version_notion_sync(uuid, timestamptz, text, text) to service_role;
