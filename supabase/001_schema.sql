create extension if not exists "pgcrypto";

create table if not exists public.admin_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.site_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  eyebrow text,
  title text,
  description text,
  content_json jsonb not null default '{}'::jsonb,
  image_url text,
  image_alt text,
  is_visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'space',
  caption text,
  description text,
  image_url text not null,
  image_alt text,
  is_video boolean not null default false,
  video_url text,
  is_visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'featured',
  name text not null,
  description text,
  price text,
  image_url text,
  image_alt text,
  is_visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value text,
  updated_at timestamptz not null default now()
);

create table if not exists public.content_revisions (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_site_sections_updated_at on public.site_sections;
create trigger set_site_sections_updated_at before update on public.site_sections for each row execute function public.set_updated_at();
drop trigger if exists set_gallery_items_updated_at on public.gallery_items;
create trigger set_gallery_items_updated_at before update on public.gallery_items for each row execute function public.set_updated_at();
drop trigger if exists set_menu_items_updated_at on public.menu_items;
create trigger set_menu_items_updated_at before update on public.menu_items for each row execute function public.set_updated_at();
drop trigger if exists set_site_settings_updated_at on public.site_settings;
create trigger set_site_settings_updated_at before update on public.site_settings for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_profiles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

alter table public.admin_profiles enable row level security;
alter table public.site_sections enable row level security;
alter table public.gallery_items enable row level security;
alter table public.menu_items enable row level security;
alter table public.site_settings enable row level security;
alter table public.content_revisions enable row level security;

drop policy if exists "Admins can read admin profiles" on public.admin_profiles;
create policy "Admins can read admin profiles" on public.admin_profiles for select to authenticated using (public.is_admin());

drop policy if exists "Public can read visible sections" on public.site_sections;
create policy "Public can read visible sections" on public.site_sections for select to anon, authenticated using (is_visible = true or public.is_admin());
drop policy if exists "Admins can manage sections" on public.site_sections;
create policy "Admins can manage sections" on public.site_sections for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read visible gallery" on public.gallery_items;
create policy "Public can read visible gallery" on public.gallery_items for select to anon, authenticated using (is_visible = true or public.is_admin());
drop policy if exists "Admins can manage gallery" on public.gallery_items;
create policy "Admins can manage gallery" on public.gallery_items for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read visible menu" on public.menu_items;
create policy "Public can read visible menu" on public.menu_items for select to anon, authenticated using (is_visible = true or public.is_admin());
drop policy if exists "Admins can manage menu" on public.menu_items;
create policy "Admins can manage menu" on public.menu_items for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read settings" on public.site_settings;
create policy "Public can read settings" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "Admins can manage settings" on public.site_settings;
create policy "Admins can manage settings" on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can read revisions" on public.content_revisions;
create policy "Admins can read revisions" on public.content_revisions for select to authenticated using (public.is_admin());
drop policy if exists "Admins can create revisions" on public.content_revisions;
create policy "Admins can create revisions" on public.content_revisions for insert to authenticated with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ben-chill-media', 'ben-chill-media', true, 8388608, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 8388608, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "Public can read Ben Chill media" on storage.objects;
create policy "Public can read Ben Chill media" on storage.objects for select to anon, authenticated using (bucket_id = 'ben-chill-media');
drop policy if exists "Admins can upload Ben Chill media" on storage.objects;
create policy "Admins can upload Ben Chill media" on storage.objects for insert to authenticated with check (bucket_id = 'ben-chill-media' and public.is_admin());
drop policy if exists "Admins can update Ben Chill media" on storage.objects;
create policy "Admins can update Ben Chill media" on storage.objects for update to authenticated using (bucket_id = 'ben-chill-media' and public.is_admin()) with check (bucket_id = 'ben-chill-media' and public.is_admin());
drop policy if exists "Admins can delete Ben Chill media" on storage.objects;
create policy "Admins can delete Ben Chill media" on storage.objects for delete to authenticated using (bucket_id = 'ben-chill-media' and public.is_admin());
