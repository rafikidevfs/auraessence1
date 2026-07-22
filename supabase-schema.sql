create extension if not exists pgcrypto;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'customer' check (role in ('admin', 'customer')),
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  image text not null,
  count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id text primary key,
  name text not null,
  category text not null,
  category_slug text not null,
  price numeric not null,
  old_price numeric,
  rating numeric not null default 0,
  reviews integer not null default 0,
  image text not null,
  badge text,
  description text not null default '',
  sku text not null,
  stock integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  address text not null,
  city text not null,
  cep text not null,
  payment_method text not null default 'Cartão de crédito',
  total numeric not null default 0,
  shipping numeric not null default 0,
  status text not null default 'processing',
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

alter table profiles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table wishlists enable row level security;

drop policy if exists "profiles_select_own" on profiles;
drop policy if exists "profiles_update_own" on profiles;
drop policy if exists "profiles_insert_own" on profiles;
drop policy if exists "categories_read_all" on categories;
drop policy if exists "categories_write_admin" on categories;
drop policy if exists "products_read_all" on products;
drop policy if exists "products_write_admin" on products;
drop policy if exists "orders_select_own_or_admin" on orders;
drop policy if exists "orders_insert_any_authenticated_or_guest" on orders;
drop policy if exists "orders_update_own_or_admin" on orders;
drop policy if exists "orders_delete_admin_or_owner" on orders;
drop policy if exists "wishlists_select_own" on wishlists;
drop policy if exists "wishlists_manage_own" on wishlists;

create policy "profiles_select_own" on profiles for select using (
  auth.uid() = id
  or exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  )
);
create policy "profiles_update_own" on profiles for update using (
  auth.uid() = id
  or exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  )
);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);

create policy "categories_read_all" on categories for select using (true);
create policy "categories_write_admin" on categories for all using (
  exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  )
) with check (
  exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  )
);

create policy "products_read_all" on products for select using (true);
create policy "products_write_admin" on products for all using (
  exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  )
) with check (
  exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  )
);

create policy "orders_select_own_or_admin" on orders for select using (
  auth.uid() = user_id
  or user_id is null
  or exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  )
);
create policy "orders_insert_any_authenticated_or_guest" on orders for insert with check (
  auth.uid() = user_id
  or user_id is null
  or exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  )
);
create policy "orders_update_own_or_admin" on orders for update using (
  auth.uid() = user_id
  or exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  )
) with check (
  auth.uid() = user_id
  or exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  )
);
create policy "orders_delete_admin_or_owner" on orders for delete using (
  auth.uid() = user_id
  or exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  )
);

create policy "wishlists_select_own" on wishlists for select using (auth.uid() = user_id);
create policy "wishlists_manage_own" on wishlists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
