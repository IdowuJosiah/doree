"use server";

import { redirect } from "next/navigation";
import { adminDb } from "@/lib/auth";
import { fail, refreshPublic, saved, slugify, storagePath, str } from "../_lib";

export async function createCollection(fd: FormData) {
  const db = await adminDb();
  const name = str(fd, "name");
  if (!name) fail("/admin/collections", "Name is required.");
  const { data: last } = await db.from("collections").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await db
    .from("collections")
    .insert({ name, slug: slugify(str(fd, "slug") || name), sort_order: (last?.sort_order ?? 0) + 1 })
    .select("id")
    .single();
  if (error) fail("/admin/collections", error.code === "23505" ? "That slug is already used." : error.message);
  refreshPublic();
  redirect(`/admin/collections/${data.id}?saved=1`);
}

export async function saveCollection(id: string, fd: FormData) {
  const db = await adminDb();
  const path = `/admin/collections/${id}`;
  const name = str(fd, "name");
  if (!name) fail(path, "Name is required.");
  const { error } = await db
    .from("collections")
    .update({
      name,
      slug: slugify(str(fd, "slug") || name),
      intro: str(fd, "intro"),
      sort_order: parseInt(str(fd, "sort_order") || "0", 10) || 0,
    })
    .eq("id", id);
  if (error) fail(path, error.code === "23505" ? "That slug is already used." : error.message);
  refreshPublic();
  saved(path);
}

export async function deleteCollection(id: string) {
  const db = await adminDb();
  const { error } = await db.from("collections").delete().eq("id", id);
  if (error) fail(`/admin/collections/${id}`, error.message);
  refreshPublic();
  redirect("/admin/collections");
}

export async function setBanner(id: string, urls: string[]) {
  const db = await adminDb();
  const { data: old } = await db.from("collections").select("banner_url").eq("id", id).maybeSingle();
  const { error } = await db.from("collections").update({ banner_url: urls[0] }).eq("id", id);
  if (error) throw new Error(error.message);
  const file = old?.banner_url && storagePath(old.banner_url);
  if (file) await db.storage.from("media").remove([file]);
  refreshPublic();
}

export async function clearBanner(id: string) {
  const db = await adminDb();
  await db.from("collections").update({ banner_url: null }).eq("id", id);
  refreshPublic();
  saved(`/admin/collections/${id}`);
}

export async function addProductToCollection(id: string, fd: FormData) {
  const db = await adminDb();
  const productId = str(fd, "product_id");
  if (productId) {
    const { data: last } = await db
      .from("collection_products")
      .select("sort_order")
      .eq("collection_id", id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    await db.from("collection_products").insert({ collection_id: id, product_id: productId, sort_order: (last?.sort_order ?? 0) + 1 });
  }
  refreshPublic();
  saved(`/admin/collections/${id}`);
}

export async function removeProductFromCollection(id: string, productId: string) {
  const db = await adminDb();
  await db.from("collection_products").delete().eq("collection_id", id).eq("product_id", productId);
  refreshPublic();
  saved(`/admin/collections/${id}`);
}

export async function moveProduct(id: string, productId: string, direction: "up" | "down") {
  const db = await adminDb();
  const { data } = await db.from("collection_products").select("product_id").eq("collection_id", id).order("sort_order");
  const ids = (data ?? []).map((r) => r.product_id as string);
  const i = ids.indexOf(productId);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i >= 0 && j >= 0 && j < ids.length) {
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await Promise.all(ids.map((pid, order) => db.from("collection_products").update({ sort_order: order }).eq("collection_id", id).eq("product_id", pid)));
  }
  refreshPublic();
  redirect(`/admin/collections/${id}`);
}
