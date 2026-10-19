import type { Metadata } from "next";
import { GroupEditor } from "../../_groups/GroupEditor";

export const metadata: Metadata = { title: "Edit collection" };

export default async function EditCollectionPage(props: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> }) {
  return <GroupEditor kind="collection" id={(await props.params).id} searchParams={await props.searchParams} />;
}
