import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TextPageLayout } from "@/components/TextPageLayout";
import { getPage } from "@/lib/data/pages";

const GUIDES = ["size-guide", "jewelry-care", "materials"];
type Props = { params: { slug: string } };

export const revalidate = 60;
export const dynamicParams = false;
export const generateStaticParams = () => GUIDES.map((slug) => ({ slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: (await getPage(params.slug))?.title };
}

const rings = [
  ["5", "49.3", "15.7"],
  ["6", "51.9", "16.5"],
  ["7", "54.4", "17.3"],
  ["8", "57.0", "18.1"],
  ["9", "59.5", "18.9"],
];
const bracelets = [
  ['6.5"', '5.5" to 6"'],
  ['7"', '6" to 6.5"'],
  ['7.5"', '6.5" to 7"'],
];

function SizeTables() {
  const th = "label border-b border-line py-2 pr-4 text-left font-normal";
  const td = "border-b border-line py-2 pr-4";
  return (
    <div className="mt-12 space-y-10">
      <table className="w-full text-sm">
        <caption className="mb-3 text-left font-display text-xl">Ring sizes</caption>
        <thead><tr><th className={th}>US size</th><th className={th}>Circumference (mm)</th><th className={th}>Diameter (mm)</th></tr></thead>
        <tbody>{rings.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i} className={td}>{c}</td>)}</tr>)}</tbody>
      </table>
      <table className="w-full text-sm">
        <caption className="mb-3 text-left font-display text-xl">Bracelet lengths</caption>
        <thead><tr><th className={th}>Bracelet length</th><th className={th}>Fits a wrist of</th></tr></thead>
        <tbody>{bracelets.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i} className={td}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export default async function GuidePage({ params }: Props) {
  if (!GUIDES.includes(params.slug)) notFound();
  const page = await getPage(params.slug);
  if (!page) notFound();
  return (
    <TextPageLayout page={page} eyebrow="Care and guides">
      {params.slug === "size-guide" && <SizeTables />}
    </TextPageLayout>
  );
}
