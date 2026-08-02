# Connecting TJC OS to your Supabase project

Everything in the app already talks to Supabase through `src/services`. Three manual steps remain.

## 1. Enter your credentials

Open `.env` in the project root and fill in the two values from
Supabase → Project Settings → API:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-anon-key
```

These are publishable values, safe to commit. Nothing is hardcoded anywhere else.
Reload the app afterwards (Vite reads `.env` at startup).

## 2. Create the database, RLS policies and storage buckets

In Supabase → SQL Editor → New query, paste the whole of
`supabase/migrations/0001_tjc_os_init.sql` and run it. It creates:

- `profiles`, `user_roles` (+ `app_role` enum, `has_role()`, `is_staff()`)
- content tables: media_library, songs, videos, gallery, posts, biography,
  projects, homepage_sections, navigation, seo_settings, site_configuration, analytics
- inbound tables: contacts, messages, newsletter, activity_logs
- RLS on every table: public reads published rows only, staff (ceo/admin/editor) manage everything
- storage buckets: `images`, `videos`, `music`, `avatars` (public) and `documents` (private)

## 3. Create your CEO account

1. Supabase → Authentication → Users → **Add user** (email + password, confirm the email).
2. SQL Editor:

```sql
insert into public.user_roles (user_id, role)
select id, 'ceo' from auth.users where email = 'you@example.com'
on conflict do nothing;
```

Then sign in at `/auth`. The dashboard, sidebar and every module are gated by that role.

## Password reset

Add your site URL and `https://your-domain/reset-password` under
Supabase → Authentication → URL Configuration → Redirect URLs.

## Portability

No Lovable-managed backend is used: your GitHub repo, your Supabase project, your deployment.
Swapping providers later only means adding a new adapter in `src/services/providers`.