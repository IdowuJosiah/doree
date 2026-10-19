import type { Metadata } from "next";
import { GroupList } from "../_groups/GroupList";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage(props: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  return <GroupList kind="category" searchParams={await props.searchParams} />;
}
