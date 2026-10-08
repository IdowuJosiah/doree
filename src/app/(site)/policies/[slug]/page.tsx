import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TextPageLayout } from "@/components/TextPageLayout";
import { getPage } from "@/lib/data/pages";

const POLICIES = ["shipping", "returns", "privacy", "terms"];
type Props = { params: { slug: string } };

export const revalidate = 60;
export const dynamicParams = false;
export const generateStaticParams = () => POLICIES.map((slug) => ({ slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: (await getPage(params.slug))?.title };
}

export default async function PolicyPage({ params }: Props) {
  if (!POLICIES.includes(params.slug)) notFound();
  const page = await getPage(params.slug);
  if (!page) notFound();
  return <TextPageLayout page={page} eyebrow="Policies" />;
}
