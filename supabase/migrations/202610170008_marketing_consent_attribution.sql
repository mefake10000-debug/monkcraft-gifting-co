-- Separate email-marketing permission and campaign attribution from quote follow-up.

create table public.customer_marketing_permissions (
  id uuid primary key default gen_random_uuid(),
  normalized_email text not null unique,
  channel text not null default 'email' check (channel = 'email'),
  status text not null default 'active' check (status in ('active', 'revoked')),
  latest_request_id uuid not null references public.quote_requests(id),
  wording_version text not null,
  consented_at timestamptz not null default now(),
  revoked_at timestamptz,
  updated_at timestamptz not null default now(),
  check ((status = 'active' and revoked_at is null) or (status = 'revoked' and revoked_at is not null))
);
create index customer_marketing_permissions_status_idx on public.customer_marketing_permissions(status, consented_at desc);

create table public.customer_marketing_permission_events (
  id uuid primary key default gen_random_uuid(),
  permission_id uuid not null references public.customer_marketing_permissions(id) on delete cascade,
  request_id uuid references public.quote_requests(id),
  event_type text not null check (event_type in ('opted_in', 'opted_out')),
  channel text not null default 'email' check (channel = 'email'),
  wording_version text,
  source text,
  evidence_reference text,
  actor text not null,
  occurred_at timestamptz not null default now()
);
create index customer_marketing_permission_events_idx on public.customer_marketing_permission_events(permission_id, occurred_at desc);

alter table public.customer_marketing_permissions enable row level security;
alter table public.customer_marketing_permission_events enable row level security;
revoke all on public.customer_marketing_permissions, public.customer_marketing_permission_events from anon, authenticated;
grant all on public.customer_marketing_permissions, public.customer_marketing_permission_events to service_role;

create or replace function public.capture_email_marketing_consent()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_email text;
  v_permission public.customer_marketing_permissions;
  v_source text;
begin
  if new.payload->>'marketingEmailOptIn' is distinct from 'true' then return new; end if;
  v_email := lower(trim(coalesce(new.payload->'contact'->>'email', '')));
  if v_email = '' then raise exception 'email is required for email marketing consent' using errcode = '22023'; end if;
  if length(v_email) > 254 or position('@' in v_email) < 2 then raise exception 'invalid consent email address' using errcode = '22023'; end if;
  v_source := left(coalesce(new.payload->'attribution'->'lastTouch'->>'source', new.payload->>'source', 'unknown'), 120);

  insert into public.customer_marketing_permissions (
    normalized_email, channel, status, latest_request_id, wording_version, consented_at, revoked_at, updated_at
  ) values (
    v_email, 'email', 'active', new.id, 'email-marketing-v1', now(), null, now()
  ) on conflict (normalized_email) do update set
    status = 'active', latest_request_id = excluded.latest_request_id,
    wording_version = excluded.wording_version, consented_at = now(), revoked_at = null, updated_at = now()
  returning * into v_permission;

  insert into public.customer_marketing_permission_events (
    permission_id, request_id, event_type, channel, wording_version, source, actor
  ) values (v_permission.id, new.id, 'opted_in', 'email', 'email-marketing-v1', v_source, 'website_quote_request');
  return new;
end;
$$;
create trigger quote_request_marketing_consent_trigger
  after insert on public.quote_requests
  for each row execute function public.capture_email_marketing_consent();

create or replace function public.revoke_customer_marketing_permission(
  p_permission_id uuid, p_evidence_reference text, p_actor text
)
returns setof public.customer_marketing_permissions
language plpgsql security definer set search_path = public
as $$
declare
  v_permission public.customer_marketing_permissions;
  v_actor text := nullif(left(trim(coalesce(p_actor, '')), 120), '');
  v_evidence text := nullif(left(trim(coalesce(p_evidence_reference, '')), 500), '');
begin
  if v_actor is null or v_evidence is null then raise exception 'actor and opt-out evidence reference are required' using errcode = '22023'; end if;
  select * into v_permission from public.customer_marketing_permissions where id = p_permission_id for update;
  if not found then raise exception 'marketing permission not found' using errcode = 'P0002'; end if;
  if v_permission.status = 'active' then
    update public.customer_marketing_permissions set status = 'revoked', revoked_at = now(), updated_at = now()
      where id = p_permission_id returning * into v_permission;
    insert into public.customer_marketing_permission_events (
      permission_id, request_id, event_type, channel, wording_version, source, evidence_reference, actor
    ) values (v_permission.id, v_permission.latest_request_id, 'opted_out', 'email', v_permission.wording_version,
      'staff_recorded', v_evidence, v_actor);
  end if;
  return next v_permission;
end;
$$;

create or replace view public.marketing_campaign_performance as
select
  coalesce(nullif(q.payload->'attribution'->'lastTouch'->>'source', ''), nullif(q.payload->>'source', ''), 'unknown') as source,
  coalesce(nullif(q.payload->'attribution'->'lastTouch'->>'medium', ''), 'unknown') as medium,
  coalesce(nullif(q.payload->'attribution'->'lastTouch'->>'campaign', ''), 'unattributed') as campaign,
  count(*)::bigint as request_count,
  count(*) filter (where q.status = 'Won')::bigint as won_count,
  count(o.id)::bigint as order_count
from public.quote_requests q
left join public.orders o on o.quote_request_id = q.id
group by 1, 2, 3;

create or replace view public.marketing_consent_summary as
select status, count(*)::bigint as contact_count
from public.customer_marketing_permissions group by status;

revoke all on function public.capture_email_marketing_consent() from public, anon, authenticated;
revoke all on function public.revoke_customer_marketing_permission(uuid, text, text) from public, anon, authenticated;
revoke all on public.marketing_campaign_performance, public.marketing_consent_summary from anon, authenticated;
grant execute on function public.revoke_customer_marketing_permission(uuid, text, text) to service_role;
grant select on public.marketing_campaign_performance to service_role;
grant select on public.marketing_consent_summary to service_role;
