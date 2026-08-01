# TJC OS — Architecture

Public brand site (`TJC | Thulani Joseph`) + private management system (`TJC OS`).

## Stack
React 19 · TypeScript · Vite · TanStack Router/Query · Tailwind v4. No backend SDK is
imported anywhere in the app — all data access goes through a service contract.

## Folder map
| Path | Purpose |
| --- | --- |
| `src/routes` | File-based routes. Public pages at top level, TJC OS under `_authenticated/`. |
| `src/components/layout` | Public site chrome (header, footer, hero, empty states). |
| `src/components/dashboard` | TJC OS shell: sidebar, topbar, module workspace. |
| `src/components/ui` | shadcn primitives. |
| `src/config` | Dashboard module registry, integration registry. |
| `src/constants` | Brand + navigation source of truth. |
| `src/contexts` | Auth context (session, roles, RBAC helpers). |
| `src/services` | Backend-agnostic contracts (`types.ts`), providers, service locator. |
| `src/types` | Domain types: `BaseRecord`, roles, results. |
| `src/assets` | CDN asset pointers and generated imagery. |

## Data layer (no vendor lock-in)
`src/services/types.ts` defines `AuthService`, `Repository<T>`, `StorageService`.
`src/services/index.ts` is the locator; `setServices(container)` swaps the provider.
Today `providers/unconfigured.ts` is active and returns a typed
`backend_not_configured` error for every call, so the UI stays honest and never
fabricates data.

**Connecting a backend** — add `src/services/providers/<name>.ts` implementing
`ServiceContainer`, then call `setServices()` during bootstrap. Nothing else changes.

## Records
Every table is expected to expose the `BaseRecord` envelope: `id` (uuid),
`created_at`, `updated_at`, `created_by`, `updated_by`, `status`, `deleted_at`
(soft delete), plus `slug` where addressable.

## Auth & RBAC
Roles: `ceo > admin > editor > team > visitor` (`ROLE_RANK` in `src/types`).
`src/routes/_authenticated/route.tsx` is the single gate (`ssr: false`, redirects to
`/auth`). Modules declare `minRole`; the sidebar and workspace filter on it.
Roles must live in a dedicated roles table on the backend — never on the profile row.

## Dashboard modules
`src/config/dashboard-modules.ts` is the registry. Adding a module = one entry;
routing (`/dashboard/$module`), sidebar placement and permissions follow automatically.
A module with a `resource` reads through `Repository<T>`; one without renders as
architecture-ready (AI Center, Automation Center).

## Integrations
`src/config/integrations.ts` lists prepared adapters (OpenAI, Gemini, Claude,
OpenRouter, YouTube, Meta, TikTok, LinkedIn, Spotify, Apple Music, email, push,
payments) with the env keys their adapter will read. Secrets never live in code.

## SEO
Per-route `head()` with title, description, OG tags, self-referencing canonical.
Person JSON-LD in `__root.tsx`. `public/robots.txt` disallows `/auth` and `/dashboard`.
`public/sitemap.xml` uses relative paths until a domain is set.

## Design system
All tokens in `src/styles.css` (`oklch`): background `#0B0B0B`, surface `#1C1C1C`,
gold `#D4AF37`, plus success/warning/error/info. Utilities: `text-gold-gradient`,
`surface-glass`, `surface-panel`, `hairline-gold`, `numeric`, `container-tjc`,
`section-y`, `animate-rise`. Never hardcode colors in components.
