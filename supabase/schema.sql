-- =====================================================================
-- Sole & Thread: database setup for Supabase
-- Run this once in your project's SQL Editor (it is safe to run again).
--
-- Who can do what (enforced by the database, not by the web page):
--   • Anyone          read products, read product images
--   • Signed-in users create their own orders, read their own orders
--   • Admin           add / edit / delete products, upload images, read all orders
-- The admin is whoever is listed in public.admins AND has confirmed that
-- email address, so nobody can become admin just by signing up with it.
-- =====================================================================

-- ---------- Admins ----------
create table if not exists public.admins (
  email text primary key
);
alter table public.admins enable row level security;  -- no policies: not readable or writable through the API

insert into public.admins (email) values ('paquejefferson@gmail.com')
on conflict (email) do nothing;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from auth.users u
    join public.admins a on lower(a.email) = lower(u.email)
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------- Products ----------
create table if not exists public.products (
  id          text primary key check (id ~ '^[a-z0-9-]{1,60}$'),
  type        text not null check (type in ('shoe', 'tee')),
  name        text not null check (char_length(name) between 1 and 60),
  price       numeric(10, 2) not null check (price > 0),
  tag         text check (tag in ('New', 'Best seller', 'Limited', 'Sale')),
  featured    boolean not null default false,
  description text not null default '',
  details     jsonb not null default '[]'::jsonb,
  colors      jsonb,
  color       text,
  layout      text,
  image       text,
  sort        integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Only one hero per type: featuring a product un-features the others of its type
create or replace function public.products_before_write()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if new.featured then
    update public.products set featured = false
    where type = new.type and id <> new.id and featured;
  end if;
  return new;
end;
$$;
drop trigger if exists products_before_write on public.products;
create trigger products_before_write
  before insert or update on public.products
  for each row execute function public.products_before_write();

alter table public.products enable row level security;
drop policy if exists "Products are public"     on public.products;
drop policy if exists "Admin can add products"  on public.products;
drop policy if exists "Admin can edit products" on public.products;
drop policy if exists "Admin can delete products" on public.products;
create policy "Products are public"       on public.products for select using (true);
create policy "Admin can add products"    on public.products for insert to authenticated with check (public.is_admin());
create policy "Admin can edit products"   on public.products for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admin can delete products" on public.products for delete to authenticated using (public.is_admin());

-- ---------- Orders ----------
create table if not exists public.orders (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  email       text not null default (auth.jwt() ->> 'email'),
  items       jsonb not null check (jsonb_typeof(items) = 'array'),
  total       numeric(10, 2) not null check (total >= 0),
  shipping    jsonb not null default '{}'::jsonb,
  status      text not null default 'demo',
  created_at  timestamptz not null default now()
);
create index if not exists orders_user_id_idx on public.orders (user_id, created_at desc);

alter table public.orders enable row level security;
drop policy if exists "Users create their own orders" on public.orders;
drop policy if exists "Users read their own orders"   on public.orders;
create policy "Users create their own orders" on public.orders for insert to authenticated
  with check (user_id = auth.uid() and status = 'demo' and email = (auth.jwt() ->> 'email'));
create policy "Users read their own orders" on public.orders for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ---------- Product images (Storage) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "Product images are public"     on storage.objects;
drop policy if exists "Admin can upload product images" on storage.objects;
drop policy if exists "Admin can change product images" on storage.objects;
drop policy if exists "Admin can delete product images" on storage.objects;
create policy "Product images are public" on storage.objects for select
  using (bucket_id = 'product-images');
create policy "Admin can upload product images" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());
create policy "Admin can change product images" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
create policy "Admin can delete product images" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
