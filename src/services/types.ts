import type { AuthSession, BaseRecord, Credentials, Result } from "@/types";

/**
 * Service contracts. The application only ever talks to these interfaces,
 * so the backend (Supabase today, anything tomorrow) stays swappable.
 */

export interface AuthService {
  getSession(): Promise<AuthSession | null>;
  signIn(credentials: Credentials): Promise<Result<AuthSession>>;
  signOut(): Promise<Result<null>>;
  requestPasswordReset(email: string): Promise<Result<null>>;
  updatePassword(password: string): Promise<Result<null>>;
  onAuthStateChange(listener: (session: AuthSession | null) => void): () => void;
}

export interface ListQuery {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
  orderBy?: string;
  ascending?: boolean;
}

export interface Page<T> {
  items: T[];
  total: number;
}

/** Generic CRUD contract used by every dashboard module. */
export interface Repository<T extends BaseRecord> {
  list(query?: ListQuery): Promise<Result<Page<T>>>;
  getBySlugOrId(key: string): Promise<Result<T | null>>;
  create(input: Partial<T>): Promise<Result<T>>;
  update(id: string, input: Partial<T>): Promise<Result<T>>;
  softDelete(id: string): Promise<Result<null>>;
}

export interface StorageObject {
  name: string;
  path: string;
  bucket: string;
  size: number;
  mimeType: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  owner: string | null;
}

export interface UploadOptions {
  upsert?: boolean;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

export interface StorageService {
  upload(bucket: string, path: string, file: File): Promise<Result<{ url: string }>>;
  uploadWithProgress(bucket: string, path: string, file: File, options?: UploadOptions): Promise<Result<{ url: string }>>;
  list(bucket: string, prefix?: string): Promise<Result<StorageObject[]>>;
  move(bucket: string, from: string, to: string): Promise<Result<null>>;
  signedUrl(bucket: string, path: string, expiresIn?: number): Promise<Result<{ url: string }>>;
  remove(bucket: string, path: string): Promise<Result<null>>;
  publicUrl(bucket: string, path: string): string;
}

export interface ServiceContainer {
  auth: AuthService;
  storage: StorageService;
  repository<T extends BaseRecord>(resource: string): Repository<T>;
}
