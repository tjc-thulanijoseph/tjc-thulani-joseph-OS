-- ============================================================================
-- TJC OS — Phase 3 additive migration (CMS completion)
-- Safe to run on top of db/tjc_os_init.sql. Adds nothing destructive.
-- Run in YOUR Supabase project: Dashboard -> SQL Editor -> New query.
-- ============================================================================

-- ------------------------------------------------- new content tables ------
-- Same envelope as every other TJC OS content table.
do $$
declare
  t text;
  new_tables text[] := array['products','social_links'];
begin
  foreach t in array new_tables loop
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
    execute format($p$create policy "Public reads published" on public.%I
      for select to anon, authenticated using (status = 'published' and deleted_at is null)$p$, t);

    execute format('drop policy if exists "Staff read all" on public.%I', t);
    execute format($p$create policy "Staff read all" on public.%I
      for select to authenticated using (public.is_staff(auth.uid()))$p$, t);

    execute format('drop policy if exists "Staff write" on public.%I', t);
    execute format($p$create policy "Staff write" on public.%I
      for insert to authenticated with check (public.is_staff(auth.uid()))$p$, t);

    execute format('drop policy if exists "Staff update" on public.%I', t);
    execute format($p$create policy "Staff update" on public.%I
      for update to authenticated
      using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()))$p$, t);

    execute format('drop policy if exists "Staff delete" on public.%I', t);
    execute format($p$create policy "Staff delete" on public.%I
      for delete to authenticated using (public.is_staff(auth.uid()))$p$, t);
  end loop;
end $$;

-- --------------------------------------- inbound tables: staff deletes ------
do $$
declare t text;
begin
  foreach t in array array['contacts','messages','newsletter'] loop
    execute format('drop policy if exists "Staff delete submissions" on public.%I', t);
    execute format($p$create policy "Staff delete submissions" on public.%I
      for delete to authenticated using (public.is_staff(auth.uid()))$p$, t);
  end loop;
end $$;

-- Newsletter needs a public upsert path so re-subscribing does not 409.
alter table public.newsletter add column if not exists source text;

-- ------------------------------------------------------ user management ----
-- Staff may read the roster; only a CEO can grant or revoke roles.
drop policy if exists "Staff read profiles" on public.profiles;
create policy "Staff read profiles" on public.profiles
  for select to authenticated using (public.is_staff(auth.uid()));

drop policy if exists "Staff read all roles" on public.user_roles;
create policy "Staff read all roles" on public.user_roles
  for select to authenticated using (public.is_staff(auth.uid()));

grant insert, delete on public.user_roles to authenticated;

drop policy if exists "CEO grants roles" on public.user_roles;
create policy "CEO grants roles" on public.user_roles
  for insert to authenticated with check (public.has_role(auth.uid(), 'ceo'));

drop policy if exists "CEO revokes roles" on public.user_roles;
create policy "CEO revokes roles" on public.user_roles
  for delete to authenticated using (public.has_role(auth.uid(), 'ceo'));

-- ---------------------------------------------------------- activity log ---
grant insert on public.activity_logs to authenticated;

drop policy if exists "Staff write activity" on public.activity_logs;
create policy "Staff write activity" on public.activity_logs
  for insert to authenticated with check (public.is_staff(auth.uid()) and actor_id = auth.uid());

-- Editors should see their own trail; CEO/admin already read everything.
drop policy if exists "Staff read own activity" on public.activity_logs;
create policy "Staff read own activity" on public.activity_logs
  for select to authenticated using (actor_id = auth.uid());

-- ------------------------------------------------------------- indexes -----
do $$
declare
  t text;
  all_tables text[] := array[
    'media_library','songs','videos','gallery','posts','biography','projects',
    'homepage_sections','navigation','seo_settings','site_configuration','analytics',
    'products','social_links'
  ];
begin
  foreach t in array all_tables loop
    execute format('create index if not exists %I on public.%I (status, deleted_at, created_at desc)',
      t || '_status_idx', t);
    execute format('create index if not exists %I on public.%I (position)', t || '_position_idx', t);
  end loop;
end $$;
