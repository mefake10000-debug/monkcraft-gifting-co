-- Internal post-delivery service and customer-care queue. No messages are sent by this workflow.

create table public.customer_care_tasks (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  quote_request_id uuid not null references public.quote_requests(id) on delete cascade,
  task_type text not null check (task_type in ('Delivery check-in', 'Issue follow-up', 'Feedback request')),
  title text not null,
  status text not null default 'Open' check (status in ('Open', 'Draft ready', 'Needs review', 'Waiting on customer', 'Escalated', 'Resolved', 'Dismissed')),
  owner text,
  due_at timestamptz,
  contact_channel text check (contact_channel is null or contact_channel in ('Email', 'Phone', 'WhatsApp')),
  draft_message text,
  outcome text,
  created_by text not null,
  updated_by text not null,
  completed_at timestamptz,
  notion_page_id text,
  notion_sync_status text not null default 'pending' check (notion_sync_status in ('pending', 'synced', 'failed')),
  notion_sync_attempts integer not null default 0,
  notion_sync_after timestamptz not null default now(),
  notion_sync_locked_until timestamptz,
  notion_sync_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index customer_care_one_delivery_checkin_per_order
  on public.customer_care_tasks(order_id) where task_type = 'Delivery check-in';
create index customer_care_queue_idx on public.customer_care_tasks(status, due_at);

create table public.customer_care_events (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.customer_care_tasks(id) on delete cascade,
  event_type text not null,
  previous_status text,
  new_status text not null,
  details jsonb not null default '{}'::jsonb,
  actor text not null,
  occurred_at timestamptz not null default now()
);
create index customer_care_events_task_idx on public.customer_care_events(task_id, occurred_at desc);

alter table public.customer_care_tasks enable row level security;
alter table public.customer_care_events enable row level security;
revoke all on public.customer_care_tasks, public.customer_care_events from anon, authenticated;
grant all on public.customer_care_tasks, public.customer_care_events to service_role;

create or replace function public.queue_delivery_check_in()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare v_task public.customer_care_tasks;
begin
  if new.status = 'Delivered' and old.status is distinct from 'Delivered' then
    insert into public.customer_care_tasks (
      order_id, quote_request_id, task_type, title, status, due_at, created_by, updated_by
    ) values (
      new.id, new.quote_request_id, 'Delivery check-in', 'Check delivery experience and record any service issue',
      'Open', now() + interval '2 days', 'system:delivery', 'system:delivery'
    ) on conflict (order_id) where task_type = 'Delivery check-in' do nothing returning * into v_task;
    if found then
      insert into public.customer_care_events (task_id, event_type, new_status, details, actor)
      values (v_task.id, 'auto_created_after_delivery', 'Open', jsonb_build_object('order_code', new.order_code), 'system:delivery');
    end if;
  end if;
  return new;
end;
$$;
create trigger orders_delivery_check_in_trigger
  after update of status on public.orders
  for each row execute function public.queue_delivery_check_in();

create or replace function public.update_customer_care_task(
  p_task_id uuid default null,
  p_order_id uuid default null,
  p_task_type text default null,
  p_title text default null,
  p_status text default 'Open',
  p_owner text default null,
  p_due_at timestamptz default null,
  p_contact_channel text default null,
  p_draft_message text default null,
  p_outcome text default null,
  p_actor text default null
)
returns setof public.customer_care_tasks
language plpgsql security definer set search_path = public
as $$
declare
  v_task public.customer_care_tasks;
  v_order public.orders;
  v_previous_status text;
  v_actor text := nullif(left(trim(coalesce(p_actor, '')), 120), '');
  v_owner text := nullif(left(trim(coalesce(p_owner, '')), 120), '');
  v_title text := nullif(left(trim(coalesce(p_title, '')), 300), '');
  v_draft text := nullif(left(trim(coalesce(p_draft_message, '')), 4000), '');
  v_outcome text := nullif(left(trim(coalesce(p_outcome, '')), 2000), '');
begin
  if v_actor is null then raise exception 'actor is required' using errcode = '22023'; end if;
  if p_status not in ('Open', 'Draft ready', 'Needs review', 'Waiting on customer', 'Escalated', 'Resolved', 'Dismissed') then
    raise exception 'invalid customer-care status' using errcode = '22023';
  end if;
  if p_contact_channel is not null and p_contact_channel not in ('Email', 'Phone', 'WhatsApp') then
    raise exception 'invalid contact channel' using errcode = '22023';
  end if;
  if p_status = 'Draft ready' and (v_draft is null or p_contact_channel is null) then
    raise exception 'a message draft and contact channel are required' using errcode = '22023';
  end if;
  if p_status = 'Resolved' and v_outcome is null then raise exception 'resolution notes are required' using errcode = '22023'; end if;

  if p_task_id is null then
    if p_order_id is null or p_task_type not in ('Delivery check-in', 'Issue follow-up', 'Feedback request') or v_title is null then
      raise exception 'order, task type, and title are required' using errcode = '22023';
    end if;
    select * into v_order from public.orders where id = p_order_id;
    if not found then raise exception 'order not found' using errcode = 'P0002'; end if;
    insert into public.customer_care_tasks (
      order_id, quote_request_id, task_type, title, status, owner, due_at, contact_channel,
      draft_message, outcome, created_by, updated_by, completed_at, notion_sync_status, notion_sync_after
    ) values (
      v_order.id, v_order.quote_request_id, p_task_type, v_title, p_status, v_owner, p_due_at,
      p_contact_channel, v_draft, v_outcome, v_actor, v_actor,
      case when p_status in ('Resolved', 'Dismissed') then now() else null end, 'pending', now()
    ) returning * into v_task;
    insert into public.customer_care_events (task_id, event_type, new_status, details, actor)
    values (v_task.id, 'created', p_status, jsonb_build_object('task_type', p_task_type, 'title', v_title), v_actor);
  else
    select * into v_task from public.customer_care_tasks where id = p_task_id for update;
    if not found then raise exception 'customer-care task not found' using errcode = 'P0002'; end if;
    v_previous_status := v_task.status;
    update public.customer_care_tasks set
      title = coalesce(v_title, title), status = p_status, owner = v_owner, due_at = p_due_at,
      contact_channel = p_contact_channel, draft_message = v_draft, outcome = v_outcome,
      updated_by = v_actor, completed_at = case when p_status in ('Resolved', 'Dismissed') then now() else null end,
      notion_sync_status = 'pending', notion_sync_after = now(), updated_at = now()
    where id = p_task_id returning * into v_task;
    insert into public.customer_care_events (task_id, event_type, previous_status, new_status, details, actor)
    values (v_task.id, 'updated', v_previous_status, p_status,
      jsonb_build_object('owner', v_owner, 'due_at', p_due_at, 'contact_channel', p_contact_channel,
        'draft_message', v_draft, 'outcome', v_outcome), v_actor);
  end if;
  return next v_task;
end;
$$;

create or replace function public.claim_customer_care_notion_sync(p_task_id uuid default null)
returns table (
  task_id uuid, task_type text, title text, task_status text, owner text, due_at timestamptz,
  contact_channel text, draft_message text, outcome text, updated_at timestamptz,
  order_id uuid, order_code text, quote_request_id uuid, request_payload jsonb, notion_attempts integer
)
language plpgsql security definer set search_path = public
as $$
declare v_task public.customer_care_tasks;
begin
  select * into v_task from public.customer_care_tasks t
  where (p_task_id is null or t.id = p_task_id)
    and t.notion_sync_status in ('pending', 'failed') and t.notion_sync_after <= now()
    and (t.notion_sync_locked_until is null or t.notion_sync_locked_until < now())
  order by t.created_at limit 1 for update skip locked;
  if not found then return; end if;
  update public.customer_care_tasks set notion_sync_attempts = notion_sync_attempts + 1,
    notion_sync_locked_until = now() + interval '2 minutes' where id = v_task.id;
  return query select v_task.id, v_task.task_type, v_task.title, v_task.status, v_task.owner, v_task.due_at,
    v_task.contact_channel, v_task.draft_message, v_task.outcome, v_task.updated_at,
    o.id, o.order_code, q.id, q.payload, v_task.notion_sync_attempts + 1
  from public.orders o join public.quote_requests q on q.id = v_task.quote_request_id where o.id = v_task.order_id;
end;
$$;

create or replace function public.finish_customer_care_notion_sync(
  p_task_id uuid, p_claimed_updated_at timestamptz, p_notion_page_id text default null, p_error text default null
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if nullif(p_notion_page_id, '') is not null then
    update public.customer_care_tasks set notion_page_id = p_notion_page_id,
      notion_sync_status = case when updated_at = p_claimed_updated_at then 'synced' else 'pending' end,
      notion_sync_after = now(), notion_sync_locked_until = null, notion_sync_error = null
      where id = p_task_id;
  else
    update public.customer_care_tasks set notion_sync_status = 'failed', notion_sync_locked_until = null,
      notion_sync_after = case when updated_at = p_claimed_updated_at
        then now() + make_interval(secs => least(3600, 60 * power(2, least(notion_sync_attempts, 6))::integer))
        else now() end,
      notion_sync_error = left(coalesce(p_error, 'Notion customer-care sync failed'), 500)
      where id = p_task_id;
  end if;
end;
$$;

revoke all on function public.queue_delivery_check_in() from public, anon, authenticated;
revoke all on function public.update_customer_care_task(uuid, uuid, text, text, text, text, timestamptz, text, text, text, text) from public, anon, authenticated;
revoke all on function public.claim_customer_care_notion_sync(uuid) from public, anon, authenticated;
revoke all on function public.finish_customer_care_notion_sync(uuid, timestamptz, text, text) from public, anon, authenticated;
grant execute on function public.update_customer_care_task(uuid, uuid, text, text, text, text, timestamptz, text, text, text, text) to service_role;
grant execute on function public.claim_customer_care_notion_sync(uuid) to service_role;
grant execute on function public.finish_customer_care_notion_sync(uuid, timestamptz, text, text) to service_role;
