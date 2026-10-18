-- Audited staff workflows for supplier records and product-to-supplier mappings.

alter table public.supplier_directory
  add column whatsapp_opt_in_evidence_reference text,
  add column notion_page_id text,
  add column notion_sync_status text not null default 'pending' check (notion_sync_status in ('pending', 'synced', 'failed')),
  add column notion_synced_at timestamptz,
  add column notion_attempts integer not null default 0,
  add column notion_next_attempt_at timestamptz not null default now(),
  add column notion_locked_until timestamptz,
  add column notion_last_error text;

create table public.supplier_directory_events (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.supplier_directory(id),
  event_type text not null check (event_type in ('supplier_created', 'supplier_updated')),
  actor text not null,
  before_record jsonb,
  after_record jsonb not null,
  occurred_at timestamptz not null default now()
);
create index supplier_directory_events_history_idx on public.supplier_directory_events(supplier_id, occurred_at desc);

create table public.product_supplier_mapping_events (
  id uuid primary key default gen_random_uuid(),
  product_id text not null,
  event_type text not null check (event_type in ('mapping_created', 'mapping_updated')),
  actor text not null,
  before_record jsonb,
  after_record jsonb not null,
  occurred_at timestamptz not null default now()
);
create index product_supplier_mapping_events_history_idx on public.product_supplier_mapping_events(product_id, occurred_at desc);
alter table public.product_supplier_mapping_events drop constraint product_supplier_mapping_events_event_type_check;
alter table public.product_supplier_mapping_events add constraint product_supplier_mapping_events_event_type_check
  check (event_type in ('mapping_created', 'mapping_updated', 'mapping_deactivated'));

alter table public.supplier_directory_events enable row level security;
alter table public.product_supplier_mapping_events enable row level security;
revoke all on public.supplier_directory_events, public.product_supplier_mapping_events from anon, authenticated;
grant all on public.supplier_directory_events, public.product_supplier_mapping_events to service_role;

create or replace function public.save_supplier_directory_record(
  p_supplier_id uuid,
  p_supplier_code text,
  p_display_name text,
  p_category text,
  p_contact_name text,
  p_phone_e164 text,
  p_email text,
  p_whatsapp_opt_in boolean,
  p_opt_in_evidence_reference text,
  p_active boolean,
  p_actor text
)
returns setof public.supplier_directory
language plpgsql security definer set search_path = public
as $$
declare
  v_supplier public.supplier_directory;
  v_before jsonb;
  v_code text := upper(trim(coalesce(p_supplier_code, '')));
  v_name text := trim(coalesce(p_display_name, ''));
  v_category text := trim(coalesce(p_category, ''));
  v_actor text := nullif(left(trim(coalesce(p_actor, '')), 120), '');
  v_evidence text := nullif(left(trim(coalesce(p_opt_in_evidence_reference, '')), 500), '');
begin
  if v_actor is null or v_name = '' or v_category = '' or v_code !~ '^[A-Z0-9][A-Z0-9_-]{1,39}$' then
    raise exception 'supplier code, name, category, and actor are required' using errcode = '22023';
  end if;
  if coalesce(p_whatsapp_opt_in, false) and (nullif(trim(coalesce(p_phone_e164, '')), '') is null or v_evidence is null) then
    raise exception 'supplier WhatsApp number and opt-in evidence are required' using errcode = '22023';
  end if;
  if nullif(trim(coalesce(p_phone_e164, '')), '') is not null and trim(p_phone_e164) !~ '^\+[1-9][0-9]{6,14}$' then
    raise exception 'supplier phone must use international E.164 format' using errcode = '22023';
  end if;
  if nullif(trim(coalesce(p_email, '')), '') is not null and trim(p_email) !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'supplier email is invalid' using errcode = '22023';
  end if;

  if p_supplier_id is null then
    insert into public.supplier_directory (
      supplier_code, display_name, category, contact_name, phone_e164, email,
      whatsapp_opt_in, whatsapp_opt_in_recorded_at, whatsapp_opt_in_evidence_reference, active,
      notion_sync_status, notion_next_attempt_at
    ) values (
      v_code, v_name, v_category, nullif(trim(coalesce(p_contact_name, '')), ''),
      nullif(trim(coalesce(p_phone_e164, '')), ''), nullif(lower(trim(coalesce(p_email, ''))), ''),
      coalesce(p_whatsapp_opt_in, false), case when coalesce(p_whatsapp_opt_in, false) then now() else null end,
      case when coalesce(p_whatsapp_opt_in, false) then v_evidence else null end, coalesce(p_active, true), 'pending', now()
    ) returning * into v_supplier;
    insert into public.supplier_directory_events (supplier_id, event_type, actor, after_record)
      values (v_supplier.id, 'supplier_created', v_actor, to_jsonb(v_supplier));
  else
    select * into v_supplier from public.supplier_directory where id = p_supplier_id for update;
    if not found then raise exception 'supplier not found' using errcode = 'P0002'; end if;
    v_before := to_jsonb(v_supplier);
    update public.supplier_directory set
      supplier_code = v_code,
      display_name = v_name,
      category = v_category,
      contact_name = nullif(trim(coalesce(p_contact_name, '')), ''),
      phone_e164 = nullif(trim(coalesce(p_phone_e164, '')), ''),
      email = nullif(lower(trim(coalesce(p_email, ''))), ''),
      whatsapp_opt_in = coalesce(p_whatsapp_opt_in, false),
      whatsapp_opt_in_recorded_at = case when coalesce(p_whatsapp_opt_in, false)
        then case when v_supplier.whatsapp_opt_in then v_supplier.whatsapp_opt_in_recorded_at else now() end
        else null end,
      whatsapp_opt_in_evidence_reference = case when coalesce(p_whatsapp_opt_in, false) then v_evidence else whatsapp_opt_in_evidence_reference end,
      active = coalesce(p_active, true),
      notion_sync_status = 'pending', notion_next_attempt_at = now(), notion_locked_until = null, notion_last_error = null,
      updated_at = now()
      where id = p_supplier_id returning * into v_supplier;
    insert into public.supplier_directory_events (supplier_id, event_type, actor, before_record, after_record)
      values (v_supplier.id, 'supplier_updated', v_actor, v_before, to_jsonb(v_supplier));
  end if;
  return next v_supplier;
end;
$$;

create or replace function public.claim_supplier_directory_notion_sync(p_supplier_id uuid default null)
returns setof public.supplier_directory
language plpgsql security definer set search_path = public
as $$
declare
  v_supplier public.supplier_directory;
begin
  select * into v_supplier from public.supplier_directory
  where (p_supplier_id is null or id = p_supplier_id)
    and notion_sync_status in ('pending', 'failed')
    and notion_next_attempt_at <= now()
    and (notion_locked_until is null or notion_locked_until < now())
  order by updated_at asc
  limit 1 for update skip locked;
  if not found then return; end if;
  update public.supplier_directory set
    notion_attempts = notion_attempts + 1, notion_locked_until = now() + interval '3 minutes'
    where id = v_supplier.id returning * into v_supplier;
  return next v_supplier;
end;
$$;

create or replace function public.finish_supplier_directory_notion_sync(
  p_supplier_id uuid, p_claimed_updated_at timestamptz, p_notion_page_id text default null, p_error text default null
)
returns setof public.supplier_directory
language plpgsql security definer set search_path = public
as $$
declare
  v_supplier public.supplier_directory;
begin
  select * into v_supplier from public.supplier_directory where id = p_supplier_id for update;
  if not found then return; end if;
  if v_supplier.updated_at <> p_claimed_updated_at then
    update public.supplier_directory set notion_sync_status = 'pending', notion_next_attempt_at = now(), notion_locked_until = null
      where id = p_supplier_id returning * into v_supplier;
  elsif nullif(trim(coalesce(p_error, '')), '') is null and nullif(trim(coalesce(p_notion_page_id, '')), '') is not null then
    update public.supplier_directory set notion_sync_status = 'synced', notion_page_id = p_notion_page_id,
      notion_synced_at = now(), notion_locked_until = null, notion_last_error = null
      where id = p_supplier_id returning * into v_supplier;
  else
    update public.supplier_directory set notion_sync_status = 'failed', notion_locked_until = null,
      notion_last_error = left(coalesce(p_error, 'Notion did not return a page ID'), 400),
      notion_next_attempt_at = now() + make_interval(secs => least(3600, power(2, least(notion_attempts, 10))::integer * 15))
      where id = p_supplier_id returning * into v_supplier;
  end if;
  return next v_supplier;
end;
$$;

create or replace function public.save_product_supplier_mapping(
  p_product_id text,
  p_supplier_id uuid,
  p_category text,
  p_verified_by text,
  p_actor text
)
returns setof public.product_supplier_mappings
language plpgsql security definer set search_path = public
as $$
declare
  v_mapping public.product_supplier_mappings;
  v_before jsonb;
  v_previous_supplier_id uuid;
  v_product_id text := left(trim(coalesce(p_product_id, '')), 80);
  v_verified_by text := nullif(left(trim(coalesce(p_verified_by, '')), 120), '');
  v_actor text := nullif(left(trim(coalesce(p_actor, '')), 120), '');
begin
  if v_product_id = '' or p_supplier_id is null or v_verified_by is null or v_actor is null then
    raise exception 'product, supplier, verifier, and actor are required' using errcode = '22023';
  end if;
  if not exists (select 1 from public.supplier_directory where id = p_supplier_id and active) then
    raise exception 'mapping requires an active supplier' using errcode = '22023';
  end if;
  select to_jsonb(m), m.supplier_id into v_before, v_previous_supplier_id from public.product_supplier_mappings m where product_id = v_product_id for update;
  insert into public.product_supplier_mappings (product_id, supplier_id, category, verified_by, verified_at, active)
  values (v_product_id, p_supplier_id, nullif(left(trim(coalesce(p_category, '')), 120), ''), v_verified_by, now(), true)
  on conflict (product_id) do update set
    supplier_id = excluded.supplier_id,
    category = excluded.category,
    verified_by = excluded.verified_by,
    verified_at = now(),
    active = true
  returning * into v_mapping;
  insert into public.product_supplier_mapping_events (product_id, event_type, actor, before_record, after_record)
  values (v_product_id, case when v_before is null then 'mapping_created' else 'mapping_updated' end,
    v_actor, v_before, to_jsonb(v_mapping));
  update public.supplier_directory set notion_sync_status = 'pending', notion_next_attempt_at = now(),
    notion_locked_until = null, notion_last_error = null, updated_at = now()
    where id in (p_supplier_id, v_previous_supplier_id);
  return next v_mapping;
end;
$$;

create or replace function public.deactivate_product_supplier_mapping(p_product_id text, p_actor text)
returns setof public.product_supplier_mappings
language plpgsql security definer set search_path = public
as $$
declare
  v_mapping public.product_supplier_mappings;
  v_before jsonb;
  v_supplier_id uuid;
  v_product_id text := left(trim(coalesce(p_product_id, '')), 80);
  v_actor text := nullif(left(trim(coalesce(p_actor, '')), 120), '');
begin
  if v_product_id = '' or v_actor is null then raise exception 'product and actor are required' using errcode = '22023'; end if;
  select to_jsonb(m), m.supplier_id into v_before, v_supplier_id from public.product_supplier_mappings m where product_id = v_product_id for update;
  if v_before is null then raise exception 'product supplier mapping not found' using errcode = 'P0002'; end if;
  update public.product_supplier_mappings set active = false where product_id = v_product_id returning * into v_mapping;
  insert into public.product_supplier_mapping_events (product_id, event_type, actor, before_record, after_record)
    values (v_product_id, 'mapping_deactivated', v_actor, v_before, to_jsonb(v_mapping));
  update public.supplier_directory set notion_sync_status = 'pending', notion_next_attempt_at = now(),
    notion_locked_until = null, notion_last_error = null, updated_at = now() where id = v_supplier_id;
  return next v_mapping;
end;
$$;

revoke all on function public.save_supplier_directory_record(uuid, text, text, text, text, text, text, boolean, text, boolean, text) from public, anon, authenticated;
revoke all on function public.save_product_supplier_mapping(text, uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.deactivate_product_supplier_mapping(text, text) from public, anon, authenticated;
revoke all on function public.claim_supplier_directory_notion_sync(uuid) from public, anon, authenticated;
revoke all on function public.finish_supplier_directory_notion_sync(uuid, timestamptz, text, text) from public, anon, authenticated;
grant execute on function public.save_supplier_directory_record(uuid, text, text, text, text, text, text, boolean, text, boolean, text) to service_role;
grant execute on function public.save_product_supplier_mapping(text, uuid, text, text, text) to service_role;
grant execute on function public.deactivate_product_supplier_mapping(text, text) to service_role;
grant execute on function public.claim_supplier_directory_notion_sync(uuid) to service_role;
grant execute on function public.finish_supplier_directory_notion_sync(uuid, timestamptz, text, text) to service_role;
