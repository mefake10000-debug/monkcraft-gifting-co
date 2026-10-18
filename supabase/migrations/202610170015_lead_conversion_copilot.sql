-- Durable conversation history for the supervised sales copilot.
create table public.lead_interactions (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid not null references public.quote_requests(id) on delete cascade,
  channel text not null check (channel in ('email', 'whatsapp', 'linkedin', 'phone', 'meeting', 'internal')),
  direction text not null check (direction in ('inbound', 'outbound', 'internal_note')),
  content text not null check (length(trim(content)) between 1 and 8000),
  outcome text check (outcome is null or length(outcome) <= 500),
  actor text not null check (length(trim(actor)) between 1 and 120),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index lead_interactions_request_time_idx on public.lead_interactions(quote_request_id, occurred_at desc);
alter table public.lead_interactions enable row level security;
revoke all on public.lead_interactions from anon, authenticated;
grant all on public.lead_interactions to service_role;

comment on table public.lead_interactions is 'Staff-entered lead conversation history used for review and supervised sales coaching. Never sent automatically.';
