import "server-only";
import { adminDb } from "@/lib/auth";
import { storagePath } from "../_lib";

type Db = Awaited<ReturnType<typeof adminDb>>;
export type StoredFile = { path: string; size: number; createdAt: string };

/** Files uploaded in the last hour are left alone: they may be mid-upload. */
const GRACE_MS = 60 * 60 * 1000;

async function listAll(db: Db, prefix = ""): Promise<StoredFile[]> {
  const out: StoredFile[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db.storage.from("media").list(prefix, { limit: 1000, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(error.message);
    for (const item of data ?? []) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.name.startsWith(".")) continue; // folder placeholders
      if (item.id === null) out.push(...(await listAll(db, path))); // a folder
      else out.push({ path, size: Number(item.metadata?.size ?? 0), createdAt: item.created_at ?? "" });
    }
    if (!data || data.length < 1000) break;
  }
  return out;
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
