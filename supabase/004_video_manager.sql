create table if not exists public.video_items (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  description text default '',
  video_type text not null default 'youtube' check (video_type in ('youtube','vimeo','tiktok','facebook','mp4','external')),
  video_url text not null default '',
  thumbnail_url text default '',
  embed_url text default '',
  category text default 'video',
  sort_order integer default 0,
  is_visible boolean default true,
  autoplay boolean default false,
  muted boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  updated_by uuid
);

create index if not exists video_items_visible_order_idx
  on public.video_items (is_visible, sort_order);

alter table public.video_items enable row level security;

drop policy if exists "Public can read visible video items" on public.video_items;
create policy "Public can read visible video items"
  on public.video_items for select
  using (is_visible = true);

drop policy if exists "Authenticated admins can manage video items" on public.video_items;
create policy "Authenticated admins can manage video items"
  on public.video_items for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create or replace function public.set_video_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$;

drop trigger if exists video_items_updated_at on public.video_items;
create trigger video_items_updated_at
  before update on public.video_items
  for each row
  execute function public.set_video_items_updated_at();
