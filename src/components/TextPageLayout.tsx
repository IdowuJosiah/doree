import type { TextPage } from "@/lib/data/pages";
import { headingsOf, TextBody } from "./TextBody";

// One long-form template for guides and policies: title, intro, body, and a
// contents list beside it on desktop when the page has sections.
export function TextPageLayout({ page, children, eyebrow }: { page: TextPage; children?: React.ReactNode; eyebrow?: string }) {
  const headings = headingsOf(page.body);
  return (
    <article className="section container-page">
      {eyebrow && <p className="label mb-3 text-gold-text">{eyebrow}</p>}
      <h1 className="display-xl">{page.title}</h1>
      {page.intro && <p className="mt-6 max-w-2xl text-lg">{page.intro}</p>}
      <div className={`mt-12 grid gap-12 ${headings.length > 1 ? "lg:grid-cols-[200px_1fr]" : ""}`}>
        {headings.length > 1 && (
          <nav aria-label="On this page" className="hidden lg:block">
            <ul className="sticky top-28 space-y-2 text-sm">
              <li className="label mb-3">Contents</li>
              {headings.map((h) => <li key={h.id}><a href={`#${h.id}`} className="hover:text-gold-text">{h.text}</a></li>)}
            </ul>
          </nav>
        )}
        <div className="max-w-2xl">
          <TextBody body={page.body} />
          {children}
        </div>
      </div>
    </article>
  );
}
