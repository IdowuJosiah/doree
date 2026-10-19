// Categories (product types) and collections (named sets) share one table and
// the same admin screens; only the words and paths differ.
export type GroupKind = "category" | "collection";

export const KINDS = {
  category: {
    path: "/admin/categories",
    plural: "Categories",
    singular: "category",
    intro: "Product types such as Earrings, Necklaces, Bracelets and Rings. Each product belongs to one. Shoppers filter by these on the Shop page.",
    publicPath: "/shop",
    placeholder: "e.g. Anklets",
  },
  collection: {
    path: "/admin/collections",
    plural: "Collections",
    singular: "collection",
    intro: "Named sets of pieces, such as a seasonal launch. A collection can mix earrings, necklaces, bracelets and rings, and a product can be in more than one.",
    publicPath: "/collections",
    placeholder: "e.g. Soleil",
  },
} as const;

export const isKind = (v: string): v is GroupKind => v === "category" || v === "collection";
