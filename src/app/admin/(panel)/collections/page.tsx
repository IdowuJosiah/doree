import type { Metadata } from "next";
import { GroupList } from "../_groups/GroupList";

export const metadata: Metadata = { title: "Collections" };

export default async function CollectionsPage(props: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  return <GroupList kind="collection" searchParams={await props.searchParams} />;
}
