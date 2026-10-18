-- Durable quote intake and retryable integration outbox.
-- Apply this migration to the Moncraft Supabase project before enabling the API.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  client_submission_id text unique,
  payload_hash text not null,
  payload jsonb not null,
  status text not null default 'Request received',
  notion_page_id text,
  notion_sync_status text not null default 'pending' check (notion_sync_status in ('pending', 'synced', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_outbox (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  aggregate_id uuid not null references public.quote_requests(id) on delete cascade,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'done', 'failed')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  locked_until timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_type, aggregate_id)
);

create table if not exists public.supplier_directory (
  id uuid primary key default gen_random_uuid(),
  supplier_code text not null unique,
  display_name text not null,
  category text not null,
  contact_name text,
  phone_e164 text,
  email text,
  whatsapp_opt_in boolean not null default false,
  whatsapp_opt_in_recorded_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not whatsapp_opt_in or whatsapp_opt_in_recorded_at is not null)
);

create table if not exists public.product_supplier_mappings (
  product_id text primary key,
  supplier_id uuid not null references public.supplier_directory(id),
  category text,
  verified_by text,
  verified_at timestamptz,
  active boolean not null default true
);

alter table public.quote_requests enable row level security;
alter table public.automation_outbox enable row level security;
alter table public.supplier_directory enable row level security;
alter table public.product_supplier_mappings enable row level security;

revoke all on public.quote_requests, public.automation_outbox, public.supplier_directory, public.product_supplier_mappings from anon, authenticated;
grant all on public.quote_requests, public.automation_outbox, public.supplier_directory, public.product_supplier_mappings to service_role;

create or replace function public.submit_quote_request(p_client_submission_id text, p_payload jsonb)
returns public.quote_requests
language plpgsql
security definer
set search_path = public, extensions
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
      if v_request.payload_hash <> v_hash then
        raise exception 'submission id reused with different payload' using errcode = '23505';
      end if;
      return v_request;
    end if;
  end if;

  insert into public.quote_requests (client_submission_id, payload_hash, payload)
  values (nullif(trim(p_client_submission_id), ''), v_hash, p_payload)
  returning * into v_request;

  insert into public.automation_outbox (event_type, aggregate_id, payload)
  values ('quote_request.notion_sync', v_request.id, jsonb_build_object('request_id', v_request.id));

  return v_request;
exception
  when unique_violation then
    -- A concurrent retry with the same id may have won after the first SELECT.
    select * into v_request from public.quote_requests where client_submission_id = trim(p_client_submission_id);
    if found and v_request.payload_hash = v_hash then return v_request; end if;
    raise;
end;
$$;

create or replace function public.claim_quote_notion_sync(p_request_id uuid default null)
returns table (outbox_id uuid, request_id uuid, request_payload jsonb)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_outbox public.automation_outbox;
begin
  select * into v_outbox
  from public.automation_outbox o
  where o.event_type = 'quote_request.notion_sync'
    and (p_request_id is null or o.aggregate_id = p_request_id)
    and o.next_attempt_at <= now()
    and (o.status = 'pending' or (o.status = 'processing' and o.locked_until < now()))
  order by o.created_at
  limit 1
  for update skip locked;

  if not found then return; end if;

  update public.automation_outbox set status = 'processing', attempts = attempts + 1,
    locked_until = now() + interval '2 minutes', updated_at = now()
  where id = v_outbox.id;

  return query select v_outbox.id, q.id, q.payload
  from public.quote_requests q where q.id = v_outbox.aggregate_id;
end;
$$;

create or replace function public.finish_quote_notion_sync(p_outbox_id uuid, p_notion_page_id text default null, p_error text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_outbox public.automation_outbox;
begin
  select * into v_outbox from public.automation_outbox where id = p_outbox_id for update;
  if not found or v_outbox.event_type <> 'quote_request.notion_sync' then return; end if;

  if nullif(p_notion_page_id, '') is not null then
    update public.quote_requests set notion_page_id = p_notion_page_id,
      notion_sync_status = 'synced', updated_at = now() where id = v_outbox.aggregate_id;
    update public.automation_outbox set status = 'done', locked_until = null,
      last_error = null, updated_at = now() where id = p_outbox_id;
  else
    update public.quote_requests set notion_sync_status = 'failed', updated_at = now() where id = v_outbox.aggregate_id;
    update public.automation_outbox set status = 'pending', locked_until = null,
      next_attempt_at = now() + make_interval(secs => least(3600, 60 * power(2, least(attempts, 6))::integer)),
      last_error = left(coalesce(p_error, 'Notion sync failed'), 500), updated_at = now()
      where id = p_outbox_id;
  end if;
end;
$$;

revoke all on function public.submit_quote_request(text, jsonb) from public, anon, authenticated;
revoke all on function public.claim_quote_notion_sync(uuid) from public, anon, authenticated;
revoke all on function public.finish_quote_notion_sync(uuid, text, text) from public, anon, authenticated;
grant execute on function public.submit_quote_request(text, jsonb) to service_role;
grant execute on function public.claim_quote_notion_sync(uuid) to service_role;
grant execute on function public.finish_quote_notion_sync(uuid, text, text) to service_role;
