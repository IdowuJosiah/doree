// Renders the plain text Dorée writes in the admin: blank lines separate
// paragraphs, "## " starts a heading, "- " starts a bullet. No HTML is
// interpreted, so nothing typed there can break or inject into the page.

export type Heading = { id: string; text: string };

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function headingsOf(body: string): Heading[] {
  return body
    .split("\n")
    .filter((l) => l.startsWith("## "))
    .map((l) => ({ id: slug(l.slice(3)), text: l.slice(3).trim() }));
}

export function TextBody({ body }: { body: string }) {
  const blocks = body.replace(/\r/g, "").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="space-y-5 leading-relaxed">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const out: React.ReactNode[] = [];
        let rest = lines;
        if (lines[0].startsWith("## ")) {
          const text = lines[0].slice(3).trim();
          out.push(<h2 key="h" id={slug(text)} className="scroll-mt-28 pt-4 font-display text-2xl">{text}</h2>);
          rest = lines.slice(1);
        }
        if (rest.length && rest.every((l) => l.startsWith("- "))) {
          out.push(<ul key="l" className="list-disc space-y-1 pl-5">{rest.map((l, j) => <li key={j}>{l.slice(2)}</li>)}</ul>);
        } else if (rest.length) {
          out.push(<p key="p">{rest.join(" ")}</p>);
        }
        return <div key={i} className="space-y-3">{out}</div>;
      })}
    </div>
  );
}
