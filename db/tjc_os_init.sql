-- ============================================================================
-- TJC OS — initial schema, roles, RLS policies and storage buckets
-- Run this once in YOUR Supabase project: Dashboard → SQL Editor → New query.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- roles ----
do $$ begin
  create type public.app_role as enum ('ceo','admin','editor','team','visitor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.content_status as enum ('draft','scheduled','published','archived');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles
  for select to authenticated using (auth.uid() = id);
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

drop policy if exists "Users read own roles" on public.user_roles;
create policy "Users read own roles" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

-- Editor-or-above check used by every content policy.
create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role in ('ceo','admin','editor')
  );
$$;

-- Auto-create a profile on signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'display_name')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------- content ----
-- Every content table shares the envelope the app expects.
do $$
declare
  t text;
  content_tables text[] := array[
    'media_library','songs','videos','gallery','posts','biography','projects',
    'homepage_sections','navigation','seo_settings','site_configuration','analytics'
  ];
begin
  foreach t in array content_tables loop
    execute format($f$
      create table if not exists public.%I (
        id uuid primary key default gen_random_uuid(),
        title text,
        slug text unique,
        description text,
        body text,
        url text,
        thumbnail_url text,
        category text,
        tags text[],
        metadata jsonb not null default '{}'::jsonb,
        position integer,
        published_at timestamptz,
        status public.content_status not null default 'draft',
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        created_by uuid references auth.users(id) on delete set null,
        updated_by uuid references auth.users(id) on delete set null,
        deleted_at timestamptz
      );
    $f$, t);

    execute format('grant select on public.%I to anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists "Public reads published" on public.%I', t);
    execute format($p$
      create policy "Public reads published" on public.%I
        for select to anon, authenticated
        using (status = 'published' and deleted_at is null);
    $p$, t);

    execute format('drop policy if exists "Staff read all" on public.%I', t);
    execute format($p$
      create policy "Staff read all" on public.%I
        for select to authenticated using (public.is_staff(auth.uid()));
    $p$, t);

    execute format('drop policy if exists "Staff write" on public.%I', t);
    execute format($p$
      create policy "Staff write" on public.%I
        for insert to authenticated with check (public.is_staff(auth.uid()));
    $p$, t);

    execute format('drop policy if exists "Staff update" on public.%I', t);
    execute format($p$
      create policy "Staff update" on public.%I
        for update to authenticated
        using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
    $p$, t);

    execute format('drop policy if exists "Staff delete" on public.%I', t);
    execute format($p$
      create policy "Staff delete" on public.%I
        for delete to authenticated using (public.is_staff(auth.uid()));
    $p$, t);
  end loop;
end $$;

-- ------------------------------------------------------------- inbound ----
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  deleted_at timestamptz
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  body text not null,
  channel text,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  deleted_at timestamptz
);

create table if not exists public.newsletter (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  deleted_at timestamptz
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource text,
  resource_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  status public.content_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  deleted_at timestamptz
);

do $$
declare t text;
begin
  foreach t in array array['contacts','messages','newsletter'] loop
    execute format('grant insert on public.%I to anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists "Anyone may submit" on public.%I', t);
    execute format('create policy "Anyone may submit" on public.%I for insert to anon, authenticated with check (true)', t);

    execute format('drop policy if exists "Staff read submissions" on public.%I', t);
    execute format($p$create policy "Staff read submissions" on public.%I
      for select to authenticated using (public.is_staff(auth.uid()))$p$, t);

    execute format('drop policy if exists "Staff manage submissions" on public.%I', t);
    execute format($p$create policy "Staff manage submissions" on public.%I
      for update to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()))$p$, t);
  end loop;
end $$;

grant select on public.activity_logs to authenticated;
grant all on public.activity_logs to service_role;
alter table public.activity_logs enable row level security;

drop policy if exists "CEO and admins read activity" on public.activity_logs;
create policy "CEO and admins read activity" on public.activity_logs
  for select to authenticated
  using (public.has_role(auth.uid(), 'ceo') or public.has_role(auth.uid(), 'admin'));

-- ------------------------------------------------------------- storage ----
insert into storage.buckets (id, name, public)
values
  ('images', 'images', true),
  ('videos', 'videos', true),
  ('music', 'music', true),
  ('documents', 'documents', false),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Public read media" on storage.objects;
create policy "Public read media" on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('images','videos','music','avatars'));

drop policy if exists "Staff read documents" on storage.objects;
create policy "Staff read documents" on storage.objects
  for select to authenticated
  using (bucket_id = 'documents' and public.is_staff(auth.uid()));

drop policy if exists "Staff upload media" on storage.objects;
create policy "Staff upload media" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('images','videos','music','documents','avatars') and public.is_staff(auth.uid()));

drop policy if exists "Staff update media" on storage.objects;
create policy "Staff update media" on storage.objects
  for update to authenticated
  using (bucket_id in ('images','videos','music','documents','avatars') and public.is_staff(auth.uid()));

drop policy if exists "Staff delete media" on storage.objects;
create policy "Staff delete media" on storage.objects
  for delete to authenticated
  using (bucket_id in ('images','videos','music','documents','avatars') and public.is_staff(auth.uid()));

-- ------------------------------------------------------ grant CEO role ----
-- After creating your user in Authentication → Users, run:
--   insert into public.user_roles (user_id, role)
--   select id, 'ceo' from auth.users where email = 'you@example.com'
--   on conflict do nothing;