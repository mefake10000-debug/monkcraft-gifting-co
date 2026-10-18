-- Create a deterministic, reviewable sales-triage proposal with each durable
-- quote request. This suggests next steps; it never contacts the buyer.

create or replace function public.propose_sales_triage()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_programme jsonb := coalesce(new.payload->'programme', '{}'::jsonb);
  v_products jsonb := coalesce(new.payload->'products', '[]'::jsonb);
  v_missing text[] := array[]::text[];
  v_missing_product_ids integer := 0;
  v_product_count integer := 0;
  v_next_action text;
begin
  if jsonb_typeof(v_products) = 'array' then
    v_product_count := jsonb_array_length(v_products);
    select count(*)::integer into v_missing_product_ids
    from jsonb_array_elements(v_products) as item(value)
    where nullif(trim(coalesce(item.value->>'id', '')), '') is null;
  else
    v_missing_product_ids := 0;
  end if;

  if nullif(trim(coalesce(new.payload #>> '{contact,company}', '')), '') is null then v_missing := array_append(v_missing, 'company'); end if;
  if nullif(trim(coalesce(v_programme->>'occasion', '')), '') is null then v_missing := array_append(v_missing, 'occasion'); end if;
  if nullif(trim(coalesce(v_programme->>'recipientCount', '')), '') is null then v_missing := array_append(v_missing, 'recipient_count'); end if;
  if nullif(trim(coalesce(v_programme->>'budgetPerRecipient', '')), '') is null then v_missing := array_append(v_missing, 'budget_per_recipient'); end if;
  if nullif(trim(coalesce(v_programme->>'deliveryDate', '')), '') is null then v_missing := array_append(v_missing, 'delivery_date'); end if;
  if nullif(trim(coalesce(v_programme->>'deliveryLocation', '')), '') is null then v_missing := array_append(v_missing, 'delivery_location'); end if;

  v_next_action := case
    when cardinality(v_missing) > 0 then 'Ask the buyer for the missing brief details before preparing a quote.'
    when v_missing_product_ids > 0 then 'Resolve catalogue product IDs for the selected lines before supplier checks and quote preparation.'
    else 'Review the brief and supplier-check results, then prepare a human-priced quote draft.'
  end;

  insert into public.agent_runs (agent_key, trigger_name, quote_request_id, input_reference, proposed_action, status)
  values (
    'sales',
    'quote_request_received',
    new.id,
    new.id::text,
    jsonb_build_object(
      'brief_completeness', case when cardinality(v_missing) = 0 then 'ready_for_staff_review' else 'needs_information' end,
      'missing_fields', to_jsonb(v_missing),
      'product_line_count', v_product_count,
      'product_ids_missing', v_missing_product_ids,
      'recommended_next_action', v_next_action,
      'guardrails', jsonb_build_array('Do not invent prices, stock, tax, or delivery promises.', 'A person must review the brief and approve any customer-facing quote.')
    ),
    'Needs review'
  );
  return new;
end;
$$;

drop trigger if exists quote_request_sales_triage on public.quote_requests;
create trigger quote_request_sales_triage
after insert on public.quote_requests
for each row execute function public.propose_sales_triage();

revoke all on function public.propose_sales_triage() from public, anon, authenticated;
