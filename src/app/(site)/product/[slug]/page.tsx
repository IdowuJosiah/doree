import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddToBag } from "@/components/product/AddToBag";
import { Gallery } from "@/components/product/Gallery";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { getProductBySlug, listProducts } from "@/lib/data/catalog";
import { formatPrice } from "@/lib/format";
import { siteConfig } from "@/lib/config";

type Props = { params: { slug: string } };

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return {};
  const image = product.images[0]?.src;
  return {
    title: product.name,
    description: product.description,
    openGraph: { title: product.name, description: product.description, images: image ? [image] : [] },
  };
}

function Accordion({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details className="group border-b border-line" open={open}>
      <summary className="label flex min-h-[56px] cursor-pointer list-none items-center justify-between">
        {title}
        <span aria-hidden="true" className="text-lg transition-transform group-open:rotate-45">+</span>
      </summary>
      <div className="pb-5 text-sm leading-relaxed">{children}</div>
    </details>
  );
}

export default async function ProductPage({ params }: Props) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();
  const related = (await listProducts()).filter((p) => p.id !== product.id && !p.soldOut).slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.flatMap((i) => (i.src ? [i.src] : [])),
    offers: {
      "@type": "Offer",
      price: (product.price / 100).toFixed(2),
      priceCurrency: siteConfig.currency,
      availability: product.soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
  };

  return (
    <>
      <section className="container-page grid gap-10 pb-28 pt-8 lg:grid-cols-2 lg:gap-16 lg:py-16">
        <Gallery images={product.images} name={product.name} />
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h1 className="font-display text-4xl lg:text-5xl">{product.name}</h1>
          <p className="mt-3 text-lg">{product.soldOut ? "Sold out" : formatPrice(product.price)}</p>
          {product.description && <p className="mt-6 max-w-prose">{product.description}</p>}
          <AddToBag product={product} />
          <div className="mt-10 border-t border-line">
            <Accordion title="Details and materials" open>{product.materials || "Details coming soon."}</Accordion>
            <Accordion title="Care">{product.care || "Keep dry and store in the pouch provided."}</Accordion>
            <Accordion title="Shipping">The shipping fee is calculated at checkout from your delivery state.</Accordion>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section container-page border-t border-line">
          <Reveal><h2 className="mb-10 font-display text-3xl lg:text-4xl">You may also like</h2></Reveal>
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-4 lg:gap-x-6">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
