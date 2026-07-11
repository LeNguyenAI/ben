create table if not exists public.video_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  video_type text not null default 'youtube' check (video_type in ('youtube','vimeo','tiktok','facebook','mp4','external')),
  video_url text not null,
  thumbnail_url text,
  embed_url text,
  category text not null default 'video',
  sort_order int not null default 0,
  is_visible boolean not null default true,
  autoplay boolean not null default false,
  muted boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.video_items enable row level security;

drop trigger if exists set_video_items_updated_at on public.video_items;
create trigger set_video_items_updated_at
before update on public.video_items
for each row execute function public.set_updated_at();

drop policy if exists "Public can read visible videos" on public.video_items;
create policy "Public can read visible videos"
on public.video_items for select
to anon, authenticated
using (is_visible = true or public.is_admin());

drop policy if exists "Admins can manage videos" on public.video_items;
create policy "Admins can manage videos"
on public.video_items for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.set_video_updated_by()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_by = auth.uid();
  return new;
end;
$$;

drop trigger if exists set_video_items_updated_by on public.video_items;
create trigger set_video_items_updated_by
before insert or update on public.video_items
for each row execute function public.set_video_updated_by();
