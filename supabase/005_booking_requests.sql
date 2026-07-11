create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  booking_type text default '',
  name text not null default '',
  phone text not null default '',
  booking_date date,
  booking_time time,
  guests text default '',
  purpose text default '',
  area text default '',
  event_type text default '',
  event_scale text default '',
  budget text default '',
  concept text default '',
  note text default '',
  status text default 'new',
  source text default 'website',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists booking_requests_created_at_idx
  on public.booking_requests (created_at desc);

alter table public.booking_requests enable row level security;

drop policy if exists "Anyone can create booking requests" on public.booking_requests;
create policy "Anyone can create booking requests"
  on public.booking_requests for insert
  with check (true);

drop policy if exists "Authenticated admins can read booking requests" on public.booking_requests;
create policy "Authenticated admins can read booking requests"
  on public.booking_requests for select
  using (auth.role() = 'authenticated');

drop policy if exists "Authenticated admins can update booking requests" on public.booking_requests;
create policy "Authenticated admins can update booking requests"
  on public.booking_requests for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated admins can delete booking requests" on public.booking_requests;
create policy "Authenticated admins can delete booking requests"
  on public.booking_requests for delete
  using (auth.role() = 'authenticated');

create or replace function public.set_booking_requests_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists booking_requests_updated_at on public.booking_requests;
create trigger booking_requests_updated_at
  before update on public.booking_requests
  for each row
  execute function public.set_booking_requests_updated_at();
