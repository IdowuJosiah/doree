import type { Metadata } from "next";
import { GroupEditor } from "../../_groups/GroupEditor";

export const metadata: Metadata = { title: "Edit category" };

export default async function EditCategoryPage(props: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> }) {
  return <GroupEditor kind="category" id={(await props.params).id} searchParams={await props.searchParams} />;
}
