"use server";

import { adminDb } from "@/lib/auth";
import { contentDefaults, type LookbookPhoto } from "@/lib/data/site";
import { PAGE_SLUGS, bool, fail, refreshPublic, safeHref, saved, storagePath, str } from "../_lib";

const PATH = "/admin/content";


// Which text fields each content block accepts. Anything else in the form is ignored.
const TEXT_FIELDS: Record<string, string[]> = {
  home_hero: ["script", "title", "buttonLabel", "buttonHref"],
  brand_statement: ["text"],
  feature_panel: ["script", "title", "text", "buttonLabel", "buttonHref"],
  instagram: ["handle", "url"],
  announcement: ["text"],
  coming_soon: ["script", "title", "text", "launch"],
};
const BOOL_FIELDS: Record<string, string[]> = { coming_soon: ["enabled"] };
const IMAGE_FIELDS: Record<string, string[]> = { home_hero: ["leftImage", "rightImage"], feature_panel: ["image"], coming_soon: ["image"] };

type Db = Awaited<ReturnType<typeof adminDb>>;

async function read(db: Db, key: string): Promise<Record<string, unknown>> {
  const { data } = await db.from("site_content").select("value").eq("key", key).maybeSingle();
  const defaults = (contentDefaults as unknown as Record<string, unknown>)[key] ?? {};
  return { ...(defaults as object), ...(data?.value ?? {}) };
}

async function write(db: Db, key: string, value: unknown) {
  const { error } = await db.from("site_content").upsert({ key, value });
  if (error) fail(PATH, error.message);
  refreshPublic();
}

export async function saveContent(key: string, fd: FormData) {
  const db = await adminDb();
  const fields = TEXT_FIELDS[key];
  if (!fields) fail(PATH, "Unknown content block.");
  const value = await read(db, key);
  for (const f of fields) {
    const v = str(fd, f);
    value[f] = f === "buttonHref" ? safeHref(v) : f === "url" ? (/^https:\/\//.test(v) ? v : "https://www.instagram.com/") : v;
  }
  for (const f of BOOL_FIELDS[key] ?? []) value[f] = bool(fd, f);
  await write(db, key, value);
  saved(PATH);
}

export async function setContentImage(key: string, field: string, urls: string[]) {
  const db = await adminDb();
  if (!IMAGE_FIELDS[key]?.includes(field)) throw new Error("Unknown image field.");
  const value = await read(db, key);
  const old = String(value[field] ?? "");
  value[field] = urls[0];
  const { error } = await db.from("site_content").upsert({ key, value });
  if (error) throw new Error(error.message);
  const file = old && storagePath(old);
  if (file) await db.storage.from("media").remove([file]);
  refreshPublic();
}

export async function clearContentImage(key: string, field: string) {
  const db = await adminDb();
  if (!IMAGE_FIELDS[key]?.includes(field)) fail(PATH, "Unknown image field.");
  const value = await read(db, key);
  value[field] = "";
  await write(db, key, value);
  saved(PATH);
}

// Lookbook ------------------------------------------------------------------

async function photos(db: Db): Promise<LookbookPhoto[]> {
  return ((await read(db, "lookbook")).photos as LookbookPhoto[]) ?? [];
}

export async function addLookbookPhotos(urls: string[]) {
  const db = await adminDb();
  const list = await photos(db);
  await write(db, "lookbook", { photos: [...list, ...urls.map((url) => ({ url, alt: "" }))] });
}

export async function saveLookbookPhoto(index: number, fd: FormData) {
  const db = await adminDb();
  const list = await photos(db);
  if (!list[index]) fail(PATH, "Photo not found.");
  const alt = str(fd, "alt");
  if (!alt) fail(PATH, "Alt text is required for every lookbook photo.");
  list[index] = { ...list[index], alt, productSlug: str(fd, "productSlug") || undefined };
  await write(db, "lookbook", { photos: list });
  saved(PATH);
}

export async function moveLookbookPhoto(index: number, direction: "up" | "down") {
  const db = await adminDb();
  const list = await photos(db);
  const j = direction === "up" ? index - 1 : index + 1;
  if (list[index] && list[j]) {
    [list[index], list[j]] = [list[j], list[index]];
    await write(db, "lookbook", { photos: list });
  }
  saved(PATH);
}

export async function deleteLookbookPhoto(index: number) {
  const db = await adminDb();
  const list = await photos(db);
  const [removed] = list.splice(index, 1);
  await write(db, "lookbook", { photos: list });
  const file = removed && storagePath(removed.url);
  if (file) await db.storage.from("media").remove([file]);
  saved(PATH);
}

// Guides and policies ---------------------------------------------------------

// Home catalog covers ----------------------------------------------------------

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Covers = Record<string, { url: string; position?: string }>;

async function covers(db: Db): Promise<Covers> {
  const { data } = await db.from("site_content").select("value").eq("key", "catalog_covers").maybeSingle();
  return (data?.value ?? {}) as Covers;
}

export async function setCatalogCover(collectionId: string, urls: string[]) {
  const db = await adminDb();
  if (!UUID.test(collectionId)) throw new Error("Unknown collection.");
  const all = await covers(db);
  const old = all[collectionId]?.url;
  all[collectionId] = { url: urls[0], position: "center" };
  const { error } = await db.from("site_content").upsert({ key: "catalog_covers", value: all });
  if (error) throw new Error(error.message);
  const file = old && storagePath(old);
  if (file) await db.storage.from("media").remove([file]);
  refreshPublic();
}

export async function saveCatalogFocus(collectionId: string, fd: FormData) {
  const db = await adminDb();
  const all = await covers(db);
  if (!all[collectionId]) fail(PATH, "Upload a cover photo first.");
  all[collectionId] = { ...all[collectionId], position: str(fd, "object_position") || "center" };
  await write(db, "catalog_covers", all);
  saved(PATH);
}

export async function clearCatalogCover(collectionId: string) {
  const db = await adminDb();
  const all = await covers(db);
  const old = all[collectionId]?.url;
  delete all[collectionId];
  await write(db, "catalog_covers", all);
  const file = old && storagePath(old);
  if (file) await db.storage.from("media").remove([file]);
  saved(PATH);
}

export async function savePage(slug: string, fd: FormData) {
  const db = await adminDb();
  if (!PAGE_SLUGS.some((p) => p.slug === slug)) fail(PATH, "Unknown page.");
  await write(db, `page:${slug}`, { title: str(fd, "title"), intro: str(fd, "intro"), body: String(fd.get("body") ?? "") });
  saved(PATH);
}
