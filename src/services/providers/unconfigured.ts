import type { AuthService, Repository, ServiceContainer, StorageService } from "../types";
import type { AuthSession, BaseRecord, Result } from "@/types";

/**
 * Default provider used until a backend is wired up.
 * It never throws — every call resolves with a typed, explicit error so the
 * UI can render an honest "backend not connected" state.
 */
const NOT_CONFIGURED = {
  code: "backend_not_configured",
  message:
    "Supabase credentials are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the .env file at the project root, then reload.",
} as const;

const fail = <T>(): Promise<Result<T>> => Promise.resolve({ data: null, error: { ...NOT_CONFIGURED } });

const auth: AuthService = {
  getSession: async (): Promise<AuthSession | null> => null,
  signIn: () => fail<AuthSession>(),
  signOut: () => fail<null>(),
  requestPasswordReset: () => fail<null>(),
  updatePassword: () => fail<null>(),
  onAuthStateChange: () => () => {},
};

const storage: StorageService = {
  upload: () => fail<{ url: string }>(),
  remove: () => fail<null>(),
  publicUrl: (bucket, path) => `/${bucket}/${path}`,
};

function repository<T extends BaseRecord>(): Repository<T> {
  return {
    list: () => fail(),
    getBySlugOrId: () => fail<T | null>(),
    create: () => fail<T>(),
    update: () => fail<T>(),
    softDelete: () => fail<null>(),
  };
}

export const unconfiguredServices: ServiceContainer = {
  auth,
  storage,
  repository: <T extends BaseRecord>() => repository<T>(),
};

export const BACKEND_NOT_CONFIGURED = NOT_CONFIGURED;
