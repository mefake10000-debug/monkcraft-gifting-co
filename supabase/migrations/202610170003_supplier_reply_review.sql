-- Human review fields and audited update path for supplier availability replies.
-- Apply after 202610170002_supplier_fulfilment_analytics.sql.

alter table public.supplier_checks
  add column if not exists supplier_reply_reviewed_by text,
  add column if not exists supplier_reply_reviewed_at timestamptz,
  add column if not exists supplier_reply_review_notes text,
  add constraint supplier_checks_price_nonnegative check (quoted_unit_price is null or quoted_unit_price >= 0),
  add constraint supplier_checks_moq_positive check (moq is null or moq > 0);

create or replace function public.review_supplier_check_reply(
  p_check_id uuid,
  p_availability text,
  p_quoted_unit_price numeric default null,
  p_moq integer default null,
  p_lead_time text default null,
  p_reviewer text default null,
  p_notes text default null
)
returns setof public.supplier_checks
language plpgsql security definer set search_path = public
as $$
declare
  v_check public.supplier_checks;
  v_reviewer text := left(trim(coalesce(p_reviewer, '')), 120);
  v_notes text := left(trim(coalesce(p_notes, '')), 1000);
begin
  if p_availability is null or p_availability not in ('Available', 'Partial', 'Unavailable') then
    raise exception 'reviewed availability must be selected' using errcode = '22023';
  end if;
  if v_reviewer = '' then
    raise exception 'reviewer is required' using errcode = '22023';
  end if;
  if p_quoted_unit_price is not null and (p_quoted_unit_price < 0 or p_quoted_unit_price > 9999999999.99) then
    raise exception 'unit price is outside the supported range' using errcode = '22023';
  end if;
  if p_moq is not null and p_moq < 1 then
    raise exception 'MOQ must be a positive whole number' using errcode = '22023';
  end if;

  update public.supplier_checks c set
    availability = p_availability,
    quoted_unit_price = p_quoted_unit_price,
    moq = p_moq,
    lead_time = nullif(left(trim(coalesce(p_lead_time, '')), 200), ''),
    supplier_reply_reviewed_by = v_reviewer,
    supplier_reply_reviewed_at = now(),
    supplier_reply_review_notes = nullif(v_notes, ''),
    notion_sync_status = 'pending',
    notion_sync_after = now(),
    updated_at = now()
  where c.id = p_check_id and c.status = 'Replied' and c.reply_text is not null
  returning c.* into v_check;
  if not found then
    raise exception 'supplier reply is not ready for human review' using errcode = 'P0001';
  end if;

  insert into public.agent_runs (
    agent_key, trigger_name, quote_request_id, input_reference, proposed_action,
    status, human_correction, correction_reason, reviewer, outcome, reviewed_at
  ) values (
    'supplier_whatsapp', 'supplier_reply_human_reviewed', v_check.request_id, v_check.id::text,
    jsonb_build_object('availability', p_availability, 'quoted_unit_price', p_quoted_unit_price,
      'moq', p_moq, 'lead_time', nullif(left(trim(coalesce(p_lead_time, '')), 200), '')),
    'Approved', v_notes, 'Human reviewed supplier reply', v_reviewer,
    'Supplier response recorded as reviewed; stock is not reserved.', now()
  );
  return next v_check;
end;
$$;

-- A newer supplier reply invalidates any review of an earlier reply.
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
      availability = 'Unknown', quoted_unit_price = null, moq = null, lead_time = null,
      supplier_reply_reviewed_by = null, supplier_reply_reviewed_at = null, supplier_reply_review_notes = null,
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

revoke all on function public.review_supplier_check_reply(uuid, text, numeric, integer, text, text, text) from public, anon, authenticated;
grant execute on function public.review_supplier_check_reply(uuid, text, numeric, integer, text, text, text) to service_role;
