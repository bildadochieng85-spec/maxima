create table if not exists public.profiles (
  id text primary key,
  name text not null default '',
  email text not null default '',
  phone text not null default '',
  whatsapp text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  checkout_id text not null unique,
  user_id text not null,
  customer jsonb not null,
  items jsonb not null,
  total numeric(12, 2) not null check (total >= 0),
  status text not null default 'Pending',
  paid_at timestamptz,
  paid_phone text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.orders enable row level security;

grant select, insert, update on public.profiles to anon, authenticated;
grant select, insert, update on public.orders to anon, authenticated;

create policy "Firebase users read their own profile"
  on public.profiles for select to anon, authenticated
  using (
    auth.jwt() ->> 'iss' = 'https://securetoken.google.com/maxima-6f4dc'
    and auth.jwt() ->> 'aud' = 'maxima-6f4dc'
    and id = auth.jwt() ->> 'sub'
  );

create policy "Firebase users insert their own profile"
  on public.profiles for insert to anon, authenticated
  with check (
    auth.jwt() ->> 'iss' = 'https://securetoken.google.com/maxima-6f4dc'
    and auth.jwt() ->> 'aud' = 'maxima-6f4dc'
    and id = auth.jwt() ->> 'sub'
  );

create policy "Firebase users update their own profile"
  on public.profiles for update to anon, authenticated
  using (
    auth.jwt() ->> 'iss' = 'https://securetoken.google.com/maxima-6f4dc'
    and auth.jwt() ->> 'aud' = 'maxima-6f4dc'
    and id = auth.jwt() ->> 'sub'
  )
  with check (
    auth.jwt() ->> 'iss' = 'https://securetoken.google.com/maxima-6f4dc'
    and auth.jwt() ->> 'aud' = 'maxima-6f4dc'
    and id = auth.jwt() ->> 'sub'
  );

create policy "Firebase users read their own orders"
  on public.orders for select to anon, authenticated
  using (
    auth.jwt() ->> 'iss' = 'https://securetoken.google.com/maxima-6f4dc'
    and auth.jwt() ->> 'aud' = 'maxima-6f4dc'
    and user_id = auth.jwt() ->> 'sub'
  );

create policy "Firebase users create their own orders"
  on public.orders for insert to anon, authenticated
  with check (
    auth.jwt() ->> 'iss' = 'https://securetoken.google.com/maxima-6f4dc'
    and auth.jwt() ->> 'aud' = 'maxima-6f4dc'
    and user_id = auth.jwt() ->> 'sub'
  );

create policy "Firebase users update their own orders"
  on public.orders for update to anon, authenticated
  using (
    auth.jwt() ->> 'iss' = 'https://securetoken.google.com/maxima-6f4dc'
    and auth.jwt() ->> 'aud' = 'maxima-6f4dc'
    and user_id = auth.jwt() ->> 'sub'
  )
  with check (
    auth.jwt() ->> 'iss' = 'https://securetoken.google.com/maxima-6f4dc'
    and auth.jwt() ->> 'aud' = 'maxima-6f4dc'
    and user_id = auth.jwt() ->> 'sub'
  );
