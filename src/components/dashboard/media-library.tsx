import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Copy, Download, FileText, Grid2X2, HardDrive, Image as ImageIcon, List, Music, Pencil,
  RefreshCw, Trash2, Upload, Video, X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { services } from "@/services";
import type { StorageObject } from "@/services";
import { optimizeImage } from "@/lib/image-optimize";
import { cn } from "@/lib/utils";

const BUCKETS = ["images", "videos", "music", "documents", "avatars"] as const;
type Bucket = (typeof BUCKETS)[number];

const PRIVATE_BUCKETS: Bucket[] = ["documents"];

const BUCKET_LABEL: Record<Bucket, string> = {
  images: "Images",
  videos: "Videos",
  music: "Music",
  documents: "Documents",
  avatars: "Avatars",
};

const BUCKET_ICON: Record<Bucket, typeof ImageIcon> = {
  images: ImageIcon,
  videos: Video,
  music: Music,
  documents: FileText,
  avatars: ImageIcon,
};

const ACCEPT: Record<Bucket, string> = {
  images: "image/*",
  videos: "video/*",
  music: "audio/*",
  documents: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,application/pdf",
  avatars: "image/*",
};

/** Optional soft quota, in GB. Only shown when configured — nothing is invented. */
const QUOTA_GB = Number(import.meta.env['VITE_SUPABASE_STORAGE_QUOTA_GB'] ?? 0);

type SortKey = "newest" | "oldest" | "largest" | "smallest" | "az" | "za";

interface UploadTask {
  id: string;
  name: string;
  bucket: Bucket;
  percent: number;
  status: "uploading" | "done" | "error" | "cancelled";
  error?: string;
  /** Seconds remaining, estimated from observed throughput. */
  eta: number | null;
}

function formatEta(seconds: number | null) {
  if (seconds === null || !Number.isFinite(seconds)) return "—";
  if (seconds < 60) return `${Math.max(1, Math.round(seconds))}s left`;
  return `${Math.round(seconds / 60)}m left`;
}

function extensionOf(name: string) {
  const match = /\.([^.]+)$/.exec(name);
  return match ? match[1]!.toLowerCase() : "";
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function safeName(name: string) {
  return name.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
}

function kindOf(item: StorageObject): "image" | "video" | "audio" | "file" {
  const mime = item.mimeType ?? "";
  if (mime.startsWith("image/") || item.bucket === "images" || item.bucket === "avatars") return "image";
  if (mime.startsWith("video/") || item.bucket === "videos") return "video";
  if (mime.startsWith("audio/") || item.bucket === "music") return "audio";
  return "file";
}

async function resolveUrl(item: StorageObject) {
  const storage = services().storage;
  if (PRIVATE_BUCKETS.includes(item.bucket as Bucket)) {
    const result = await storage.signedUrl(item.bucket, item.path, 3600);
    if (result.error) throw new Error(result.error.message);
    return result.data.url;
  }
  return storage.publicUrl(item.bucket, item.path);
}

export function MediaLibrary() {
  const queryClient = useQueryClient();
  const [bucketFilter, setBucketFilter] = useState<Bucket | "all">("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [uploadBucket, setUploadBucket] = useState<Bucket>("images");
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<{ item: StorageObject; url: string } | null>(null);
  const [renaming, setRenaming] = useState<StorageObject | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const replaceTarget = useRef<StorageObject | null>(null);

  const query = useQuery({
    queryKey: ["media-library"],
    queryFn: async () => {
      const storage = services().storage;
      const results = await Promise.all(
        BUCKETS.map(async (bucket) => {
          const result = await storage.list(bucket);
          return { bucket, result };
        }),
      );
      const items: StorageObject[] = [];
      const errors: string[] = [];
      for (const { bucket, result } of results) {
        if (result.error) errors.push(`${BUCKET_LABEL[bucket]}: ${result.error.message}`);
        else items.push(...result.data);
      }
      return { items, errors };
    },
  });

  const refresh = useCallback(() => queryClient.invalidateQueries({ queryKey: ["media-library"] }), [queryClient]);

  const all = query.data?.items ?? [];

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = all.filter(
      (item) =>
        (bucketFilter === "all" || item.bucket === bucketFilter) &&
        (!term || item.name.toLowerCase().includes(term)),
    );
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "size") return b.size - a.size;
      const at = a.createdAt ? Date.parse(a.createdAt) : 0;
      const bt = b.createdAt ? Date.parse(b.createdAt) : 0;
      return sort === "oldest" ? at - bt : bt - at;
    });
    return sorted;
  }, [all, bucketFilter, search, sort]);

  const used = all.reduce((total, item) => total + item.size, 0);
  const quotaBytes = QUOTA_GB > 0 ? QUOTA_GB * 1024 ** 3 : 0;

  const startUploads = useCallback(
    async (files: File[], bucket: Bucket, targetPath?: string) => {
      const storage = services().storage;
      for (const file of files) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const path = targetPath ?? `${Date.now()}-${safeName(file.name) || "file"}`;
        setTasks((prev) => [...prev, { id, name: file.name, bucket, percent: 0, status: "uploading" }]);

        const result = await storage.uploadWithProgress(bucket, path, file, {
          upsert: Boolean(targetPath),
          onProgress: (percent) =>
            setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, percent } : task))),
        });

        if (result.error) {
          setTasks((prev) =>
            prev.map((task) =>
              task.id === id ? { ...task, status: "error", error: result.error!.message } : task,
            ),
          );
          toast.error(`${file.name} failed`, { description: result.error.message });
        } else {
          setTasks((prev) =>
            prev.map((task) => (task.id === id ? { ...task, status: "done", percent: 100 } : task)),
          );
          toast.success(`${file.name} uploaded to ${BUCKET_LABEL[bucket]}`);
          setTimeout(() => setTasks((prev) => prev.filter((task) => task.id !== id)), 4000);
        }
      }
      void refresh();
    },
    [refresh],
  );

  async function handleCopyUrl(item: StorageObject) {
    try {
      const url = await resolveUrl(item);
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch (error) {
      toast.error("Could not copy link", { description: (error as Error).message });
    }
  }

  async function handleDownload(item: StorageObject) {
    try {
      const url = await resolveUrl(item);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = item.name;
      anchor.target = "_blank";
      anchor.rel = "noreferrer";
      anchor.click();
    } catch (error) {
      toast.error("Could not download file", { description: (error as Error).message });
    }
  }

  async function handlePreview(item: StorageObject) {
    try {
      setPreview({ item, url: await resolveUrl(item) });
    } catch (error) {
      toast.error("Could not open preview", { description: (error as Error).message });
    }
  }

  async function handleDelete(item: StorageObject) {
    if (!window.confirm(`Delete “${item.name}” permanently from ${BUCKET_LABEL[item.bucket as Bucket]}?`)) return;
    setBusy(true);
    const result = await services().storage.remove(item.bucket, item.path);
    setBusy(false);
    if (result.error) toast.error("Delete failed", { description: result.error.message });
    else {
      toast.success(`${item.name} deleted`);
      void refresh();
    }
  }

  async function handleRenameSubmit() {
    if (!renaming) return;
    const next = safeName(renameValue);
    if (!next || next === renaming.name) return setRenaming(null);
    const folder = renaming.path.includes("/") ? `${renaming.path.split("/").slice(0, -1).join("/")}/` : "";
    setBusy(true);
    const result = await services().storage.move(renaming.bucket, renaming.path, `${folder}${next}`);
    setBusy(false);
    if (result.error) toast.error("Rename failed", { description: result.error.message });
    else {
      toast.success("File renamed");
      setRenaming(null);
      void refresh();
    }
  }

  function triggerReplace(item: StorageObject) {
    replaceTarget.current = item;
    replaceInput.current?.click();
  }

  useEffect(() => {
    function preventDefaults(event: DragEvent) {
      event.preventDefault();
    }
    window.addEventListener("dragover", preventDefaults);
    window.addEventListener("drop", preventDefaults);
    return () => {
      window.removeEventListener("dragover", preventDefaults);
      window.removeEventListener("drop", preventDefaults);
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-gold">Content</p>
          <h1 className="mt-3 font-display text-3xl font-semibold">Media Library</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Central store for every image, video, track and document in TJC OS.
          </p>
        </div>
        <Button variant="outline" className="rounded-full hairline-gold bg-transparent" onClick={() => void refresh()}>
          <RefreshCw className="size-4" aria-hidden /> Refresh
        </Button>
      </div>

      {/* Storage usage */}
      <Card className="mt-8 surface-panel border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <HardDrive className="size-4 text-gold" aria-hidden /> Storage usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <Usage label="Used" value={formatBytes(used)} />
            <Usage label="Files" value={String(all.length)} />
            <Usage
              label="Remaining"
              value={quotaBytes ? formatBytes(Math.max(quotaBytes - used, 0)) : "Quota not set"}
            />
          </div>
          {quotaBytes > 0 && (
            <>
              <Progress className="mt-5 h-1.5" value={Math.min((used / quotaBytes) * 100, 100)} />
              <p className="mt-2 text-xs text-muted-foreground">
                Total plan capacity {formatBytes(quotaBytes)} (set via VITE_SUPABASE_STORAGE_QUOTA_GB).
              </p>
            </>
          )}
          {quotaBytes === 0 && (
            <p className="mt-4 text-xs text-muted-foreground">
              Supabase does not expose a plan quota through the API. Set VITE_SUPABASE_STORAGE_QUOTA_GB in .env to
              show total and remaining capacity.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Upload */}
      <Card className="mt-6 surface-panel border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={uploadBucket} onValueChange={(value) => setUploadBucket(value as Bucket)}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {BUCKETS.map((bucket) => (
                  <SelectItem key={bucket} value={bucket}>{BUCKET_LABEL[bucket]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="rounded-full" onClick={() => fileInput.current?.click()}>
              <Upload className="size-4" aria-hidden /> Choose files
            </Button>
          </div>

          <div
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              const files = Array.from(event.dataTransfer.files);
              if (files.length) void startUploads(files, uploadBucket);
            }}
            className={cn(
              "mt-4 rounded-2xl border border-dashed border-border p-8 text-center transition-colors",
              dragging && "border-gold bg-accent/40",
            )}
          >
            <p className="text-sm text-muted-foreground">
              Drag and drop files here — they upload to{" "}
              <span className="text-foreground">{BUCKET_LABEL[uploadBucket]}</span>. Multiple files supported.
            </p>
          </div>

          <input
            ref={fileInput}
            type="file"
            multiple
            accept={ACCEPT[uploadBucket]}
            className="hidden"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              event.target.value = "";
              if (files.length) void startUploads(files, uploadBucket);
            }}
          />
          <input
            ref={replaceInput}
            type="file"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              const target = replaceTarget.current;
              event.target.value = "";
              replaceTarget.current = null;
              if (file && target) void startUploads([file], target.bucket as Bucket, target.path);
            }}
          />

          {tasks.length > 0 && (
            <ul className="mt-5 space-y-3">
              {tasks.map((task) => (
                <li key={task.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm">{task.name}</span>
                    <span className="numeric text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {task.status === "error" ? "Failed" : `${task.percent}%`}
                    </span>
                  </div>
                  <Progress className="mt-2 h-1.5" value={task.status === "error" ? 100 : task.percent} />
                  {task.error && <p className="mt-2 text-xs text-destructive">{task.error}</p>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Browser */}
      <Card className="mt-6 surface-panel border-border">
        <CardHeader className="gap-4 pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search media…"
              className="h-9 w-full max-w-xs"
            />
            <Select value={bucketFilter} onValueChange={(value) => setBucketFilter(value as Bucket | "all")}>
              <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All media</SelectItem>
                {BUCKETS.map((bucket) => (
                  <SelectItem key={bucket} value={bucket}>{BUCKET_LABEL[bucket]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
              <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="size">Size</SelectItem>
              </SelectContent>
            </Select>
            <div className="ml-auto flex items-center gap-1">
              <Button size="icon" variant={view === "grid" ? "secondary" : "ghost"} onClick={() => setView("grid")} aria-label="Grid view">
                <Grid2X2 className="size-4" aria-hidden />
              </Button>
              <Button size="icon" variant={view === "list" ? "secondary" : "ghost"} onClick={() => setView("list")} aria-label="List view">
                <List className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {query.data?.errors.length ? (
            <div className="mb-4 rounded-xl border border-destructive/40 p-3">
              {query.data.errors.map((message) => (
                <p key={message} className="text-xs text-destructive">{message}</p>
              ))}
            </div>
          ) : null}

          {query.isPending ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-40 w-full" />)}
            </div>
          ) : visible.length === 0 ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {all.length === 0
                ? "No files in storage yet. Upload above and they appear here instantly."
                : "No media matches this search or filter."}
            </p>
          ) : view === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((item) => (
                <MediaCard
                  key={`${item.bucket}/${item.path}`}
                  item={item}
                  busy={busy}
                  onPreview={() => void handlePreview(item)}
                  onCopy={() => void handleCopyUrl(item)}
                  onDownload={() => void handleDownload(item)}
                  onRename={() => { setRenaming(item); setRenameValue(item.name); }}
                  onReplace={() => triggerReplace(item)}
                  onDelete={() => void handleDelete(item)}
                />
              ))}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {visible.map((item) => (
                <li key={`${item.bucket}/${item.path}`} className="flex flex-wrap items-center gap-3 py-3">
                  <button type="button" onClick={() => void handlePreview(item)} className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-sm">{item.name}</span>
                    <span className="numeric mt-1 block text-xs text-muted-foreground">
                      {formatBytes(item.size)} · {formatDate(item.createdAt)} · {BUCKET_LABEL[item.bucket as Bucket]} ·{" "}
                      {item.owner ? `Uploader ${item.owner.slice(0, 8)}` : "Uploader —"}
                    </span>
                  </button>
                  <RowActions
                    busy={busy}
                    onCopy={() => void handleCopyUrl(item)}
                    onDownload={() => void handleDownload(item)}
                    onRename={() => { setRenaming(item); setRenameValue(item.name); }}
                    onReplace={() => triggerReplace(item)}
                    onDelete={() => void handleDelete(item)}
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate pr-6 font-display">{preview?.item.name}</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-4">
              {kindOf(preview.item) === "image" && (
                <img src={preview.url} alt={preview.item.name} className="max-h-[60vh] w-full rounded-xl object-contain" />
              )}
              {kindOf(preview.item) === "video" && (
                <video src={preview.url} controls className="max-h-[60vh] w-full rounded-xl" />
              )}
              {kindOf(preview.item) === "audio" && <audio src={preview.url} controls className="w-full" />}
              {kindOf(preview.item) === "file" && (
                <p className="text-sm text-muted-foreground">
                  Preview is not available for this file type. Use Download or Open link.
                </p>
              )}
              <p className="numeric text-xs text-muted-foreground">
                {formatBytes(preview.item.size)} · {formatDate(preview.item.createdAt)} ·{" "}
                {BUCKET_LABEL[preview.item.bucket as Bucket]} · {preview.item.mimeType ?? "unknown type"}
              </p>
              <DialogFooter className="gap-2 sm:justify-start">
                <Button variant="outline" className="hairline-gold bg-transparent" onClick={() => void handleCopyUrl(preview.item)}>
                  <Copy className="size-4" aria-hidden /> Copy URL
                </Button>
                <Button variant="outline" className="hairline-gold bg-transparent" onClick={() => void handleDownload(preview.item)}>
                  <Download className="size-4" aria-hidden /> Download
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rename */}
      <Dialog open={Boolean(renaming)} onOpenChange={(open) => !open && setRenaming(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">Rename file</DialogTitle></DialogHeader>
          <Input value={renameValue} onChange={(event) => setRenameValue(event.target.value)} autoFocus />
          <p className="text-xs text-muted-foreground">
            Spaces and special characters are converted automatically. The public URL changes with the name.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenaming(null)}><X className="size-4" aria-hidden /> Cancel</Button>
            <Button disabled={busy} onClick={() => void handleRenameSubmit()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Usage({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <p className="numeric mt-2 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

interface ActionProps {
  busy: boolean;
  onCopy: () => void;
  onDownload: () => void;
  onRename: () => void;
  onReplace: () => void;
  onDelete: () => void;
}

function RowActions({ busy, onCopy, onDownload, onRename, onReplace, onDelete }: ActionProps) {
  return (
    <div className="flex items-center gap-1">
      <Button size="icon" variant="ghost" aria-label="Copy public URL" onClick={onCopy}><Copy className="size-4" aria-hidden /></Button>
      <Button size="icon" variant="ghost" aria-label="Download" onClick={onDownload}><Download className="size-4" aria-hidden /></Button>
      <Button size="icon" variant="ghost" aria-label="Rename" onClick={onRename}><Pencil className="size-4" aria-hidden /></Button>
      <Button size="icon" variant="ghost" aria-label="Replace" onClick={onReplace}><RefreshCw className="size-4" aria-hidden /></Button>
      <Button size="icon" variant="ghost" aria-label="Delete" disabled={busy} onClick={onDelete}>
        <Trash2 className="size-4 text-destructive" aria-hidden />
      </Button>
    </div>
  );
}

function MediaCard({ item, onPreview, ...actions }: ActionProps & { item: StorageObject; onPreview: () => void }) {
  const kind = kindOf(item);
  const Icon = BUCKET_ICON[item.bucket as Bucket] ?? FileText;
  const isPublic = !PRIVATE_BUCKETS.includes(item.bucket as Bucket);
  const thumb = isPublic && kind === "image" ? services().storage.publicUrl(item.bucket, item.path) : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <button type="button" onClick={onPreview} className="block w-full bg-secondary/40" aria-label={`Preview ${item.name}`}>
        {thumb ? (
          <img src={thumb} alt={item.name} loading="lazy" className="h-40 w-full object-cover" />
        ) : (
          <div className="flex h-40 w-full items-center justify-center">
            <Icon className="size-8 text-gold/70" aria-hidden />
          </div>
        )}
      </button>
      <div className="p-3">
        <p className="truncate text-sm">{item.name}</p>
        <p className="numeric mt-1 text-xs text-muted-foreground">
          {formatBytes(item.size)} · {formatDate(item.createdAt)} · {BUCKET_LABEL[item.bucket as Bucket]}
        </p>
        <p className="numeric mt-1 text-xs text-muted-foreground">
          {item.owner ? `Uploader ${item.owner.slice(0, 8)}` : "Uploader —"}
        </p>
        <div className="mt-2"><RowActions {...actions} /></div>
      </div>
    </div>
  );
}