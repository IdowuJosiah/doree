"use server";

import { redirect } from "next/navigation";
import { adminDb } from "@/lib/auth";
import { dollarsToCents } from "@/lib/format";
import { bool, fail, refreshPublic, saved, slugify, storagePath, str } from "../_lib";

// Every export below is a public endpoint, so each one starts with adminDb():
// it verifies the admin role on the server and returns a session client, so
// row-level security applies to the write as well.

function productValues(fd: FormData) {
  const name = str(fd, "name");
  return {
    name,
    slug: slugify(str(fd, "slug") || name),
    price: dollarsToCents(str(fd, "price") || "0"),
    description: str(fd, "description"),
    materials: str(fd, "materials"),
    care: str(fd, "care"),
    published: bool(fd, "published"),
    sold_out: bool(fd, "sold_out"),
    best_seller: bool(fd, "best_seller"),
  };
}

export async function createProduct(fd: FormData) {
  const db = await adminDb();
  let values;
  try {
    values = productValues(fd);
  } catch (e) {
    fail("/admin/products/new", (e as Error).message);
  }
  if (!values.name) fail("/admin/products/new", "Name is required.");
  const { data, error } = await db.from("products").insert({ ...values, published: false, best_seller: false }).select("id").single();
  if (error) fail("/admin/products/new", error.code === "23505" ? "That slug is already used." : error.message);
  refreshPublic();
  redirect(`/admin/products/${data.id}?saved=1`);
}

export async function saveProduct(id: string, fd: FormData) {
  const db = await adminDb();
  const path = `/admin/products/${id}`;
  let values;
  try {
    values = productValues(fd);
  } catch (e) {
    fail(path, (e as Error).message);
  }
  if (!values.name) fail(path, "Name is required.");
  const { error } = await db.from("products").update(values).eq("id", id);
  if (error) fail(path, error.code === "23505" ? "That slug is already used." : error.message);

  // Sync collection membership.
  const wanted = new Set(fd.getAll("collections").map(String));
  const { data: current } = await db.from("collection_products").select("collection_id, sort_order").eq("product_id", id);
  const have = new Set((current ?? []).map((c) => c.collection_id as string));
  const remove = [...have].filter((c) => !wanted.has(c));
  if (remove.length) await db.from("collection_products").delete().eq("product_id", id).in("collection_id", remove);
  for (const collectionId of [...wanted].filter((c) => !have.has(c))) {
    const { data: last } = await db
      .from("collection_products")
      .select("sort_order")
      .eq("collection_id", collectionId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    await db.from("collection_products").insert({ collection_id: collectionId, product_id: id, sort_order: (last?.sort_order ?? 0) + 1 });
  }

  refreshPublic();
  saved(path);
}

export async function setArchived(id: string, archived: boolean) {
  const db = await adminDb();
  // Archiving also unpublishes, so an archived product never shows publicly.
  const { error } = await db.from("products").update(archived ? { archived: true, published: false } : { archived: false }).eq("id", id);
  if (error) fail("/admin/products", error.message);
  refreshPublic();
  redirect("/admin/products");
}

export async function duplicateProduct(id: string) {
  const db = await adminDb();
  const { data: p } = await db.from("products").select("*").eq("id", id).single();
  if (!p) fail("/admin/products", "Product not found.");
  const suffix = Math.random().toString(36).slice(2, 6);
  const { data: copy, error } = await db
    .from("products")
    .insert({
      name: `${p.name} (copy)`,
      slug: `${p.slug}-copy-${suffix}`,
      price: p.price,
      description: p.description,
      materials: p.materials,
      care: p.care,
      published: false,
      sold_out: false,
    })
    .select("id")
    .single();
  if (error) fail("/admin/products", error.message);

  const { data: variants } = await db.from("product_variants").select("label").eq("product_id", id);
  if (variants?.length) await db.from("product_variants").insert(variants.map((v) => ({ product_id: copy.id, label: v.label, stock: 0 })));
  const { data: images } = await db.from("product_images").select("url, alt, object_position, sort_order").eq("product_id", id);
  if (images?.length) await db.from("product_images").insert(images.map((i) => ({ ...i, product_id: copy.id })));

  redirect(`/admin/products/${copy.id}?saved=1`);
}

// Variants and stock -------------------------------------------------------

export async function addVariant(productId: string, fd: FormData) {
  const db = await adminDb();
  const path = `/admin/products/${productId}`;
  const label = str(fd, "label");
  if (!label) fail(path, "Variant label is required.");
  const { error } = await db.from("product_variants").insert({
    product_id: productId,
    label,
    stock: Math.max(0, parseInt(str(fd, "stock") || "0", 10) || 0),
    sku: str(fd, "sku") || null,
  });
  if (error) fail(path, error.code === "23505" ? "That SKU is already used." : error.message);
  refreshPublic();
  saved(path);
}

export async function saveVariant(productId: string, variantId: string, fd: FormData) {
  const db = await adminDb();
  const path = `/admin/products/${productId}`;
  const { error } = await db
    .from("product_variants")
    .update({
      label: str(fd, "label"),
      stock: Math.max(0, parseInt(str(fd, "stock") || "0", 10) || 0),
      sku: str(fd, "sku") || null,
    })
    .eq("id", variantId);
  if (error) fail(path, error.code === "23505" ? "That SKU is already used." : error.message);
  refreshPublic();
  saved(path);
}

export async function deleteVariant(productId: string, variantId: string) {
  const db = await adminDb();
  const { error } = await db.from("product_variants").delete().eq("id", variantId);
  if (error) fail(`/admin/products/${productId}`, error.message);
  refreshPublic();
  saved(`/admin/products/${productId}`);
}

// Images ------------------------------------------------------------------

export async function addImages(productId: string, urls: string[]) {
  const db = await adminDb();
  const { data: last } = await db
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const start = (last?.sort_order ?? -1) + 1;
  const { data: product } = await db.from("products").select("name").eq("id", productId).single();
  const { error } = await db
    .from("product_images")
    .insert(urls.map((url, i) => ({ product_id: productId, url, alt: product?.name ?? "", sort_order: start + i })));
  if (error) throw new Error(error.message);
  refreshPublic();
}

export async function saveImage(productId: string, imageId: string, fd: FormData) {
  const db = await adminDb();
  const path = `/admin/products/${productId}`;
  const alt = str(fd, "alt");
  if (!alt) fail(path, "Alt text is required for every product image.");
  const { error } = await db
    .from("product_images")
    .update({ alt, object_position: str(fd, "object_position") || "center" })
    .eq("id", imageId);
  if (error) fail(path, error.message);
  refreshPublic();
  saved(path);
}

export async function moveImage(productId: string, imageId: string, direction: "up" | "down") {
  const db = await adminDb();
  const { data } = await db.from("product_images").select("id").eq("product_id", productId).order("sort_order");
  const ids = (data ?? []).map((r) => r.id as string);
  const i = ids.indexOf(imageId);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i >= 0 && j >= 0 && j < ids.length) {
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await Promise.all(ids.map((id, order) => db.from("product_images").update({ sort_order: order }).eq("id", id)));
  }
  refreshPublic();
  redirect(`/admin/products/${productId}`);
}

export async function deleteImage(productId: string, imageId: string) {
  const db = await adminDb();
  const { data: img } = await db.from("product_images").select("url").eq("id", imageId).maybeSingle();
  const { error } = await db.from("product_images").delete().eq("id", imageId);
  if (error) fail(`/admin/products/${productId}`, error.message);
  const file = img && storagePath(img.url);
  if (file) await db.storage.from("media").remove([file]);
  refreshPublic();
  saved(`/admin/products/${productId}`);
}
