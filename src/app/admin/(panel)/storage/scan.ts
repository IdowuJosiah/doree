import "server-only";
import { adminDb } from "@/lib/auth";
import { storagePath } from "../_lib";

type Db = Awaited<ReturnType<typeof adminDb>>;
export type StoredFile = { path: string; size: number; createdAt: string };

/** Files uploaded in the last hour are left alone: they may be mid-upload. */
const GRACE_MS = 60 * 60 * 1000;

// Lists every file under a folder. Sub-folders are read several at a time:
// one request per folder, one by one, was slow enough to look like a hang.
async function listAll(db: Db, prefix = ""): Promise<StoredFile[]> {
  const files: StoredFile[] = [];
  const folders: string[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db.storage.from("media").list(prefix, { limit: 1000, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(error.message);
    for (const item of data ?? []) {
      if (item.name.startsWith(".")) continue; // folder placeholders
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) folders.push(path);
      else files.push({ path, size: Number(item.metadata?.size ?? 0), createdAt: item.created_at ?? "" });
    }
    if (!data || data.length < 1000) break;
  }
  for (let i = 0; i < folders.length; i += 10) {
    const nested = await Promise.all(folders.slice(i, i + 10).map((f) => listAll(db, f)));
    files.push(...nested.flat());
  }
  return files;
}

/** Every storage path the site still points at, from all the tables that hold photos. */
async function referencedPaths(db: Db): Promise<Set<string>> {
  const [images, groups, content] = await Promise.all([
    db.from("product_images").select("url"),
    db.from("collections").select("banner_url"),
    db.from("site_content").select("value"),
  ]);
  for (const r of [images, groups, content]) if (r.error) throw new Error(r.error.message);
  const urls = [
    ...(images.data ?? []).map((r) => r.url as string),
    ...(groups.data ?? []).map((r) => r.banner_url as string | null),
  ];
  // Site content is free-form JSON; pick out anything that looks like one of our files.
  const text = JSON.stringify((content.data ?? []).map((r) => r.value));
  urls.push(...(text.match(/https?:[^"\s]*\/storage\/v1\/object\/public\/media\/[^"\s]+/g) ?? []));
  return new Set(urls.flatMap((u) => (u ? [storagePath(u)] : [])).filter(Boolean).map((p) => decodeURIComponent(p)));
}

export async function scanStorage(db: Db) {
  const [files, used] = await Promise.all([listAll(db), referencedPaths(db)]);
  const cutoff = Date.now() - GRACE_MS;
  const unused = files.filter((f) => !used.has(f.path) && (!f.createdAt || Date.parse(f.createdAt) < cutoff));
  const sum = (list: StoredFile[]) => list.reduce((n, f) => n + f.size, 0);
  return {
    totalCount: files.length,
    totalBytes: sum(files),
    unused,
    unusedBytes: sum(unused),
  };
}
