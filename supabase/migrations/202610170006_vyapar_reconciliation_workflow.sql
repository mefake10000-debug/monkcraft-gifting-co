-- Human-entered Vyapar reconciliation records with append-only change history.

alter table public.vyapar_reconciliation
  add column client_submission_id uuid unique,
  add constraint vyapar_expected_amount_nonnegative check (expected_amount is null or expected_amount >= 0) not valid,
  add constraint vyapar_recorded_amount_nonnegative check (recorded_amount is null or recorded_amount >= 0) not valid;

create table public.vyapar_reconciliation_events (
  id uuid primary key default gen_random_uuid(),
  reconciliation_id uuid not null references public.vyapar_reconciliation(id) on delete cascade,
  event_type text not null check (event_type in ('created', 'updated')),
  before_record jsonb,
  after_record jsonb not null,
  actor text not null,
  occurred_at timestamptz not null default now()
);
create index vyapar_reconciliation_events_record_idx on public.vyapar_reconciliation_events(reconciliation_id, occurred_at desc);
alter table public.vyapar_reconciliation_events enable row level security;
revoke all on public.vyapar_reconciliation_events from anon, authenticated;
grant all on public.vyapar_reconciliation_events to service_role;

create or replace function public.record_vyapar_reconciliation(
  p_reconciliation_id uuid default null,
  p_order_id uuid default null,
  p_quote_request_id uuid default null,
  p_document_type text default null,
  p_vyapar_reference text default null,
  p_expected_amount numeric default null,
  p_recorded_amount numeric default null,
  p_status text default 'Needs entry',
  p_entered_by text default null,
  p_document_date date default null,
  p_notes text default null,
  p_actor text default null,
  p_client_submission_id uuid default null
)
returns setof public.vyapar_reconciliation
language plpgsql security definer set search_path = public
as $$
declare
  v_row public.vyapar_reconciliation;
  v_before jsonb;
  v_actor text := nullif(left(trim(coalesce(p_actor, '')), 120), '');
  v_entered_by text := nullif(left(trim(coalesce(p_entered_by, '')), 120), '');
  v_reference text := nullif(left(trim(coalesce(p_vyapar_reference, '')), 200), '');
  v_notes text := nullif(left(trim(coalesce(p_notes, '')), 2000), '');
begin
  if v_actor is null then raise exception 'actor is required' using errcode = '22023'; end if;
  if p_document_type not in ('Estimate', 'Sales order', 'Invoice', 'Receipt', 'Supplier bill', 'Credit note') then
    raise exception 'invalid Vyapar document type' using errcode = '22023';
  end if;
  if p_status not in ('Needs entry', 'Entered in Vyapar', 'Matched', 'Mismatch', 'Needs review') then
    raise exception 'invalid reconciliation status' using errcode = '22023';
  end if;
  if p_expected_amount < 0 or p_recorded_amount < 0 then raise exception 'amounts cannot be negative' using errcode = '22023'; end if;
  if p_order_id is null and p_quote_request_id is null then raise exception 'an order or quote request is required' using errcode = '22023'; end if;
  if p_status in ('Entered in Vyapar', 'Matched', 'Mismatch') and (v_reference is null or p_document_date is null or v_entered_by is null) then
    raise exception 'Vyapar reference, document date, and staff name are required' using errcode = '22023';
  end if;
  if p_status in ('Matched', 'Mismatch') and (p_expected_amount is null or p_recorded_amount is null) then
    raise exception 'both expected and Vyapar-recorded amounts are required to reconcile' using errcode = '22023';
  end if;
  if p_status = 'Matched' and abs(p_expected_amount - p_recorded_amount) > 0.01 then
    raise exception 'amounts differ; record a mismatch or send for review' using errcode = '22023';
  end if;
  if p_status = 'Mismatch' and abs(p_expected_amount - p_recorded_amount) <= 0.01 then
    raise exception 'amounts match; use the Matched status' using errcode = '22023';
  end if;
  if p_status = 'Needs review' and v_notes is null then raise exception 'review note is required' using errcode = '22023'; end if;

  if p_reconciliation_id is null then
    if p_client_submission_id is not null then
      select * into v_row from public.vyapar_reconciliation where client_submission_id = p_client_submission_id for update;
      if found then
        if v_row.order_id is distinct from p_order_id or v_row.document_type is distinct from p_document_type
          or v_row.vyapar_reference is distinct from v_reference or v_row.expected_amount is distinct from p_expected_amount
          or v_row.recorded_amount is distinct from p_recorded_amount or v_row.status is distinct from p_status
          or v_row.entered_by is distinct from v_entered_by or v_row.document_date is distinct from p_document_date
          or v_row.notes is distinct from v_notes then
          raise exception 'finance submission key was reused with different content' using errcode = '22023';
        end if;
        return next v_row;
        return;
      end if;
    end if;
    insert into public.vyapar_reconciliation (
      client_submission_id, order_id, quote_request_id, document_type, vyapar_reference, expected_amount,
      recorded_amount, status, entered_by, document_date, notes, updated_at
    ) values (
      p_client_submission_id, p_order_id, p_quote_request_id, p_document_type, v_reference, p_expected_amount,
      p_recorded_amount, p_status, v_entered_by, p_document_date, v_notes, now()
    ) returning * into v_row;
    insert into public.vyapar_reconciliation_events (reconciliation_id, event_type, after_record, actor)
    values (v_row.id, 'created', to_jsonb(v_row), v_actor);
  else
    select * into v_row from public.vyapar_reconciliation where id = p_reconciliation_id for update;
    if not found then raise exception 'reconciliation record not found' using errcode = 'P0002'; end if;
    v_before := to_jsonb(v_row);
    update public.vyapar_reconciliation set
      order_id = p_order_id, quote_request_id = p_quote_request_id, document_type = p_document_type,
      vyapar_reference = v_reference, expected_amount = p_expected_amount, recorded_amount = p_recorded_amount,
      status = p_status, entered_by = v_entered_by, document_date = p_document_date, notes = v_notes,
      updated_at = now()
    where id = p_reconciliation_id returning * into v_row;
    insert into public.vyapar_reconciliation_events (reconciliation_id, event_type, before_record, after_record, actor)
    values (v_row.id, 'updated', v_before, to_jsonb(v_row), v_actor);
  end if;
  return next v_row;
end;
$$;

revoke all on function public.record_vyapar_reconciliation(uuid, uuid, uuid, text, text, numeric, numeric, text, text, date, text, text, uuid) from public, anon, authenticated;
grant execute on function public.record_vyapar_reconciliation(uuid, uuid, uuid, text, text, numeric, numeric, text, text, date, text, text, uuid) to service_role;
