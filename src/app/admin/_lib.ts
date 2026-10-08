import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
export const bool = (fd: FormData, key: string) => fd.get(key) === "on";

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Goes back to a screen with an error message shown at the top. */
export function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export function saved(path: string): never {
  redirect(`${path}?saved=1`);
}

/** Public pages are cached; admin writes refresh them. */
export const refreshPublic = () => revalidatePath("/", "layout");

/** Only same-site paths and https links are allowed in editable buttons. */
export const safeHref = (v: string) => (v.startsWith("/") && !v.startsWith("//")) || /^https:\/\//.test(v) ? v : "/shop";

/** Storage object path from a public URL, for best-effort cleanup. */
export const storagePath = (url: string) => url.split("/storage/v1/object/public/media/")[1];

export const PAGE_SLUGS = [
  { slug: "size-guide", label: "Size guide" },
  { slug: "jewelry-care", label: "Jewelry care" },
  { slug: "materials", label: "Materials" },
  { slug: "shipping", label: "Shipping policy" },
  { slug: "returns", label: "Returns policy" },
  { slug: "privacy", label: "Privacy policy" },
  { slug: "terms", label: "Terms" },
  { slug: "about", label: "About page" },
];
