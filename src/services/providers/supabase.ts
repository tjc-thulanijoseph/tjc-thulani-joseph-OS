import { supabase } from "@/lib/supabase";
import type {
  AuthService, ListQuery, Page, Repository, ServiceContainer, StorageObject, StorageService, UploadOptions,
} from "../types";
import type { AuthSession, BaseRecord, Result, Role } from "@/types";

/**
 * Supabase provider. Implements the same contracts as every other provider,
 * so nothing outside src/services knows which backend is in use.
 */

const client = () => {
  if (!supabase) throw new Error("Supabase client unavailable");
  return supabase;
};

const ok = <T>(data: T): Result<T> => ({ data, error: null });
const err = (code: string, message: string) => ({ data: null, error: { code, message } }) as const;

async function buildSession(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null, expiresAt: number | null): Promise<AuthSession | null> {
  if (!user) return null;
  const sb = client();

  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    sb.from("profiles").select("display_name, avatar_url").eq("id", user.id).maybeSingle(),
    sb.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  const roles = ((roleRows ?? []) as { role: Role }[]).map((row) => row.role);

  return {
    user: {
      id: user.id,
      email: user.email ?? "",
      displayName:
        (profile as { display_name?: string | null } | null)?.display_name ??
        (user.user_metadata?.["display_name"] as string | undefined) ??
        null,
      avatarUrl: (profile as { avatar_url?: string | null } | null)?.avatar_url ?? null,
      roles,
    },
    expiresAt: expiresAt ? new Date(expiresAt * 1000).toISOString() : null,
  };
}

const auth: AuthService = {
  async getSession() {
    const { data } = await client().auth.getSession();
    if (!data.session) return null;
    const { data: verified } = await client().auth.getUser();
    if (!verified.user) return null;
    return buildSession(verified.user, data.session.expires_at ?? null);
  },

  async signIn({ email, password }) {
    const { data, error } = await client().auth.signInWithPassword({ email, password });
    if (error) return err("auth_sign_in_failed", error.message);
    const session = await buildSession(data.user, data.session?.expires_at ?? null);
    if (!session) return err("auth_sign_in_failed", "Could not establish a session.");
    return ok(session);
  },

  async signOut() {
    const { error } = await client().auth.signOut();
    return error ? err("auth_sign_out_failed", error.message) : ok(null);
  },

  async requestPasswordReset(email) {
    const { error } = await client().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return error ? err("auth_reset_failed", error.message) : ok(null);
  },

  async updatePassword(password) {
    const { error } = await client().auth.updateUser({ password });
    return error ? err("auth_update_password_failed", error.message) : ok(null);
  },

  onAuthStateChange(listener) {
    const { data } = client().auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") return;
      if (!session) {
        listener(null);
        return;
      }
      void buildSession(session.user, session.expires_at ?? null).then(listener);
    });
    return () => data.subscription.unsubscribe();
  },
};

const storage: StorageService = {
  async upload(bucket, path, file) {
    const { error } = await client().storage.from(bucket).upload(path, file, { upsert: true });
    if (error) return err("storage_upload_failed", error.message);
    return ok({ url: client().storage.from(bucket).getPublicUrl(path).data.publicUrl });
  },

  /** Real byte-level progress: the JS client has no progress events, so we call the Storage REST API directly. */
  async uploadWithProgress(bucket, path, file, options: UploadOptions = {}) {
    const sb = client();
    const { data: sessionData } = await sb.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return err("storage_upload_failed", "You must be signed in to upload files.");

    const base = (import.meta.env['VITE_SUPABASE_URL'] as string).replace(/\/$/, "");
    const endpoint = `${base}/storage/v1/object/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;

    const result = await new Promise<Result<null>>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open(options.upsert ? "PUT" : "POST", endpoint, true);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.setRequestHeader("x-upsert", options.upsert ? "true" : "false");
      if (file.type) xhr.setRequestHeader("Content-Type", file.type);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) options.onProgress?.(Math.round((event.loaded / event.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) return resolve(ok(null));
        let message = `Upload failed (${xhr.status}).`;
        try {
          const parsed = JSON.parse(xhr.responseText) as { message?: string; error?: string };
          message = parsed.message ?? parsed.error ?? message;
        } catch { /* keep default message */ }
        resolve(err("storage_upload_failed", message));
      };
      xhr.onerror = () => resolve(err("storage_upload_failed", "Network error during upload."));
      xhr.onabort = () => resolve(err("storage_upload_aborted", "Upload cancelled."));
      options.signal?.addEventListener("abort", () => xhr.abort());
      xhr.send(file);
    });

    if (result.error) return err(result.error.code, result.error.message);
    return ok({ url: sb.storage.from(bucket).getPublicUrl(path).data.publicUrl });
  },

  async list(bucket, prefix = "") {
    const { data, error } = await client()
      .storage.from(bucket)
      .list(prefix, { limit: 1000, sortBy: { column: "created_at", order: "desc" } });
    if (error) return err("storage_list_failed", error.message);

    const rows = (data ?? []).filter((entry) => entry.id !== null);
    const items: StorageObject[] = rows.map((entry) => {
      const metadata = (entry.metadata ?? {}) as { size?: number; mimetype?: string };
      return {
        name: entry.name,
        path: prefix ? `${prefix}/${entry.name}` : entry.name,
        bucket,
        size: metadata.size ?? 0,
        mimeType: metadata.mimetype ?? null,
        createdAt: entry.created_at ?? null,
        updatedAt: entry.updated_at ?? null,
        owner: (entry as { owner?: string | null }).owner ?? null,
      };
    });
    return ok(items);
  },

  async move(bucket, from, to) {
    const { error } = await client().storage.from(bucket).move(from, to);
    return error ? err("storage_move_failed", error.message) : ok(null);
  },

  async signedUrl(bucket, path, expiresIn = 3600) {
    const { data, error } = await client().storage.from(bucket).createSignedUrl(path, expiresIn);
    if (error || !data) return err("storage_signed_url_failed", error?.message ?? "Could not create a link.");
    return ok({ url: data.signedUrl });
  },

  async remove(bucket, path) {
    const { error } = await client().storage.from(bucket).remove([path]);
    return error ? err("storage_remove_failed", error.message) : ok(null);
  },
  publicUrl: (bucket, path) => client().storage.from(bucket).getPublicUrl(path).data.publicUrl,
};

function repository<T extends BaseRecord>(resource: string): Repository<T> {
  const table = () => client().from(resource);

  return {
    async list(query: ListQuery = {}) {
      const page = query.page ?? 1;
      const perPage = query.perPage ?? 20;
      const from = (page - 1) * perPage;

      let request = table()
        .select("*", { count: "exact" })
        .is("deleted_at", null)
        .order(query.orderBy ?? "created_at", { ascending: query.ascending ?? false })
        .range(from, from + perPage - 1);

      if (query.status) request = request.eq("status", query.status);
      if (query.search) request = request.ilike("title", `%${query.search}%`);

      const { data, error, count } = await request;
      if (error) return err("list_failed", error.message);
      return ok<Page<T>>({ items: (data ?? []) as T[], total: count ?? 0 });
    },

    async getBySlugOrId(key) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);
      const { data, error } = await table().select("*").eq(isUuid ? "id" : "slug", key).is("deleted_at", null).maybeSingle();
      if (error) return err("get_failed", error.message);
      return ok((data ?? null) as T | null);
    },

    async create(input) {
      const { data, error } = await table().insert(input as never).select().single();
      if (error) return err("create_failed", error.message);
      return ok(data as T);
    },

    async update(id, input) {
      const { data, error } = await table().update(input as never).eq("id", id).select().single();
      if (error) return err("update_failed", error.message);
      return ok(data as T);
    },

    async softDelete(id) {
      const { error } = await table().update({ deleted_at: new Date().toISOString() } as never).eq("id", id);
      return error ? err("delete_failed", error.message) : ok(null);
    },
  };
}

export const supabaseServices: ServiceContainer = {
  auth,
  storage,
  repository: <T extends BaseRecord>(resource: string) => repository<T>(resource),
};