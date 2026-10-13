-- Lakshmi Silver Palace public catalogue schema.
-- Run this migration in the Supabase project before adding production data.
create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique check (length(trim(sku)) between 1 and 80),
  name text not null check (length(trim(name)) between 1 and 180),
  category_id uuid references public.categories(id) on delete set null,
  description text,
  price numeric(12,2) check (price is null or price >= 0),
  image_urls text[] not null default '{}',
  is_featured boolean not null default false,
  is_published boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_public_category_idx on public.products(category_id, sort_order, created_at desc) where is_published and is_active;
create index if not exists products_featured_idx on public.products(is_featured, sort_order) where is_published and is_active;
create index if not exists categories_public_idx on public.categories(sort_order) where is_active;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists categories_touch_updated_at on public.categories;
create trigger categories_touch_updated_at before update on public.categories for each row execute function public.touch_updated_at();
drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at before update on public.products for each row execute function public.touch_updated_at();

alter table public.categories enable row level security;
alter table public.products enable row level security;

drop policy if exists "Public can read active categories" on public.categories;
create policy "Public can read active categories" on public.categories for select to anon, authenticated using (is_active);
drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories" on public.categories for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Public can read published products" on public.products;
create policy "Public can read published products" on public.products for select to anon, authenticated using (is_published and is_active);
drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products" on public.products for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

grant select on public.categories, public.products to anon, authenticated;
grant insert, update, delete on public.categories, public.products to authenticated;

insert into public.categories (name, slug, sort_order) values
  ('Bracelets', 'bracelets', 1), ('Anklets', 'anklets', 2), ('Bangles', 'bangles', 3),
  ('Necklaces', 'necklaces', 4), ('Earrings', 'earrings', 5), ('Rings', 'rings', 6)
on conflict (slug) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catalog-images', 'catalog-images', true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Catalog images are public" on storage.objects;
create policy "Catalog images are public" on storage.objects for select to anon, authenticated using (bucket_id = 'catalog-images');
drop policy if exists "Admins upload catalog images" on storage.objects;
create policy "Admins upload catalog images" on storage.objects for insert to authenticated
  with check (bucket_id = 'catalog-images' and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Admins update catalog images" on storage.objects;
create policy "Admins update catalog images" on storage.objects for update to authenticated
  using (bucket_id = 'catalog-images' and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check (bucket_id = 'catalog-images' and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Admins delete catalog images" on storage.objects;
create policy "Admins delete catalog images" on storage.objects for delete to authenticated
  using (bucket_id = 'catalog-images' and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
