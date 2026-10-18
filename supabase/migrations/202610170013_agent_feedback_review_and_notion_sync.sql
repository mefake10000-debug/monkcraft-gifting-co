-- Human review history and retryable Notion sync for bounded agent runs.

alter table public.agent_runs drop constraint if exists agent_runs_agent_key_check;
alter table public.agent_runs add constraint agent_runs_agent_key_check
  check (agent_key in ('prospect_crm', 'marketing_seo', 'sales', 'supplier_whatsapp', 'fulfillment', 'finance_analytics', 'customer_care'));
alter table public.agent_runs
  add column updated_at timestamptz not null default now(),
  add column notion_page_id text,
  add column notion_sync_status text not null default 'pending' check (notion_sync_status in ('pending', 'synced', 'failed')),
  add column notion_synced_at timestamptz,
  add column notion_attempts integer not null default 0,
  add column notion_next_attempt_at timestamptz not null default now(),
  add column notion_locked_until timestamptz,
  add column notion_last_error text;
create index agent_runs_status_created_idx on public.agent_runs(status, created_at desc);
create index agent_runs_notion_sync_idx on public.agent_runs(notion_sync_status, notion_next_attempt_at);

create table public.agent_run_feedback_events (
  id uuid primary key default gen_random_uuid(),
  agent_run_id uuid not null references public.agent_runs(id) on delete cascade,
  event_type text not null check (event_type in ('review_decision')),
  previous_status text not null,
  new_status text not null,
  before_feedback jsonb not null,
  after_feedback jsonb not null,
  actor text not null,
  occurred_at timestamptz not null default now()
);
create index agent_run_feedback_events_run_idx on public.agent_run_feedback_events(agent_run_id, occurred_at desc);
alter table public.agent_run_feedback_events enable row level security;
revoke all on public.agent_run_feedback_events from anon, authenticated;
grant all on public.agent_run_feedback_events to service_role;

create or replace function public.review_agent_run(
  p_agent_run_id uuid, p_status text, p_human_correction text, p_correction_reason text, p_outcome text, p_reviewer text
)
returns setof public.agent_runs
language plpgsql security definer set search_path = public
as $$
declare
  v_run public.agent_runs;
  v_actor text := nullif(left(trim(coalesce(p_reviewer, '')), 120), '');
  v_correction text := nullif(left(trim(coalesce(p_human_correction, '')), 2000), '');
  v_reason text := nullif(left(trim(coalesce(p_correction_reason, '')), 1000), '');
  v_outcome text := nullif(left(trim(coalesce(p_outcome, '')), 2000), '');
  v_before jsonb;
  v_after jsonb;
begin
  if v_actor is null then raise exception 'reviewer is required' using errcode = '22023'; end if;
  if p_status not in ('Approved', 'Rejected', 'Completed', 'Failed') then
    raise exception 'invalid agent review decision' using errcode = '22023';
  end if;
  if p_status = 'Rejected' and (v_correction is null or v_reason is null) then
    raise exception 'rejected runs require a human correction and reason' using errcode = '22023';
  end if;
  if p_status in ('Approved', 'Completed', 'Failed') and v_outcome is null then
    raise exception 'review outcome is required' using errcode = '22023';
  end if;

  select * into v_run from public.agent_runs where id = p_agent_run_id for update;
  if not found then raise exception 'agent run not found' using errcode = 'P0002'; end if;
  if v_run.status not in ('Proposed', 'Needs review') then
    raise exception 'agent run has already received a decision' using errcode = 'P0001';
  end if;
  v_before := jsonb_build_object('status', v_run.status, 'human_correction', v_run.human_correction,
    'correction_reason', v_run.correction_reason, 'reviewer', v_run.reviewer, 'outcome', v_run.outcome);
  update public.agent_runs set status = p_status, human_correction = v_correction, correction_reason = v_reason,
    reviewer = v_actor, outcome = v_outcome, reviewed_at = now(), updated_at = now(),
    notion_sync_status = 'pending', notion_next_attempt_at = now(), notion_locked_until = null, notion_last_error = null
    where id = p_agent_run_id returning * into v_run;
  v_after := jsonb_build_object('status', v_run.status, 'human_correction', v_run.human_correction,
    'correction_reason', v_run.correction_reason, 'reviewer', v_run.reviewer, 'outcome', v_run.outcome);
  insert into public.agent_run_feedback_events(agent_run_id, event_type, previous_status, new_status, before_feedback, after_feedback, actor)
    values (v_run.id, 'review_decision', (v_before->>'status'), v_run.status, v_before, v_after, v_actor);
  return next v_run;
end;
$$;

create or replace function public.claim_agent_run_notion_sync(p_agent_run_id uuid default null)
returns setof public.agent_runs
language plpgsql security definer set search_path = public
as $$
declare v_run public.agent_runs;
begin
  select * into v_run from public.agent_runs
  where (p_agent_run_id is null or id = p_agent_run_id)
    and notion_sync_status in ('pending', 'failed') and notion_next_attempt_at <= now()
    and (notion_locked_until is null or notion_locked_until < now())
  order by updated_at asc limit 1 for update skip locked;
  if not found then return; end if;
  update public.agent_runs set notion_attempts = notion_attempts + 1,
    notion_locked_until = now() + interval '3 minutes' where id = v_run.id returning * into v_run;
  return next v_run;
end;
$$;

create or replace function public.finish_agent_run_notion_sync(
  p_agent_run_id uuid, p_claimed_updated_at timestamptz, p_notion_page_id text default null, p_error text default null
)
returns setof public.agent_runs
language plpgsql security definer set search_path = public
as $$
declare v_run public.agent_runs;
begin
  select * into v_run from public.agent_runs where id = p_agent_run_id for update;
  if not found then return; end if;
  if v_run.updated_at <> p_claimed_updated_at then
    update public.agent_runs set notion_sync_status = 'pending', notion_next_attempt_at = now(), notion_locked_until = null
      where id = p_agent_run_id returning * into v_run;
  elsif nullif(trim(coalesce(p_error, '')), '') is null and nullif(trim(coalesce(p_notion_page_id, '')), '') is not null then
    update public.agent_runs set notion_sync_status = 'synced', notion_page_id = p_notion_page_id,
      notion_synced_at = now(), notion_locked_until = null, notion_last_error = null
      where id = p_agent_run_id returning * into v_run;
  else
    update public.agent_runs set notion_sync_status = 'failed', notion_locked_until = null,
      notion_last_error = left(coalesce(p_error, 'Notion did not return a page ID'), 400),
      notion_next_attempt_at = now() + make_interval(secs => least(3600, power(2, least(notion_attempts, 10))::integer * 15))
      where id = p_agent_run_id returning * into v_run;
  end if;
  return next v_run;
end;
$$;

revoke all on function public.review_agent_run(uuid, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.claim_agent_run_notion_sync(uuid) from public, anon, authenticated;
revoke all on function public.finish_agent_run_notion_sync(uuid, timestamptz, text, text) from public, anon, authenticated;
grant execute on function public.review_agent_run(uuid, text, text, text, text, text) to service_role;
grant execute on function public.claim_agent_run_notion_sync(uuid) to service_role;
grant execute on function public.finish_agent_run_notion_sync(uuid, timestamptz, text, text) to service_role;
