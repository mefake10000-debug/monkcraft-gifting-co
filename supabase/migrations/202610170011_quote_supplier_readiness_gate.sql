-- Prevent a quote from entering approval, approval-complete, or sent states
-- until its product suppliers have returned reviewed availability.
-- This check is evidence at review time, not a reservation or stock guarantee.

create or replace function public.assert_quote_supplier_readiness(p_request_id uuid, p_snapshot jsonb)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.supplier_checks sc where sc.request_id = p_request_id) then
    raise exception 'quote_supplier_checks_not_ready: supplier checks have not been prepared' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.supplier_checks sc
    where sc.request_id = p_request_id and (
      sc.supplier_id is null
      or sc.status <> 'Replied'
      or sc.supplier_reply_reviewed_at is null
      or sc.availability <> 'Available'
      or not exists (select 1 from public.supplier_directory sd where sd.id = sc.supplier_id and sd.active)
      or exists (
        select 1 from jsonb_array_elements(sc.product_lines) as checked_line(value)
        where not exists (
          select 1 from public.product_supplier_mappings pm
          where pm.product_id = (checked_line.value->>'id') and pm.supplier_id = sc.supplier_id and pm.active
        )
      )
    )
  ) then
    raise exception 'quote_supplier_checks_not_ready: every requested supplier check must be mapped, active, reviewed, and available' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from jsonb_array_elements(coalesce(p_snapshot->'lines', '[]'::jsonb)) as quote_line(value)
    where not exists (
      select 1
      from public.supplier_checks sc
      join public.supplier_directory sd on sd.id = sc.supplier_id and sd.active
      join public.product_supplier_mappings pm on pm.supplier_id = sc.supplier_id and pm.product_id = (quote_line.value->>'productId') and pm.active
      where sc.request_id = p_request_id and sc.status = 'Replied'
        and sc.availability = 'Available' and sc.supplier_reply_reviewed_at is not null
        and exists (
          select 1 from jsonb_array_elements(sc.product_lines) as checked_line(value)
          where (checked_line.value->>'id') = (quote_line.value->>'productId')
        )
    )
  ) then
    raise exception 'quote_supplier_checks_not_ready: every quoted catalogue item needs a reviewed available supplier check' using errcode = 'P0001';
  end if;
end;
$$;

create or replace function public.require_quote_supplier_readiness()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.status in ('Approval requested', 'Approved', 'Sent') then
    perform public.assert_quote_supplier_readiness(new.quote_request_id, new.snapshot);
  end if;
  return new;
end;
$$;

create trigger quote_versions_require_supplier_readiness_trigger
  before update of status on public.quote_versions
  for each row execute function public.require_quote_supplier_readiness();

revoke all on function public.assert_quote_supplier_readiness(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.require_quote_supplier_readiness() from public, anon, authenticated;
grant execute on function public.assert_quote_supplier_readiness(uuid, jsonb) to service_role;
