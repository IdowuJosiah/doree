// Renders the plain text Dorée writes in the admin: blank lines separate
// paragraphs, "## " starts a heading, "- " starts a bullet and "1. " a numbered
// step. A paragraph line can lead into a list in the same block. No HTML is
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
        // Group consecutive lines: bullets, numbered steps, or plain text.
        const kind = (l: string) => (l.startsWith("- ") ? "ul" : /^\d+\.\s/.test(l) ? "ol" : "p");
        let j = 0;
        while (j < rest.length) {
          const k = kind(rest[j]);
          const group: string[] = [];
          while (j < rest.length && kind(rest[j]) === k) group.push(rest[j++]);
          if (k === "ul") {
            out.push(<ul key={j} className="list-disc space-y-1 pl-5">{group.map((l, n) => <li key={n}>{l.slice(2)}</li>)}</ul>);
          } else if (k === "ol") {
            out.push(<ol key={j} className="list-decimal space-y-1 pl-5">{group.map((l, n) => <li key={n}>{l.replace(/^\d+\.\s/, "")}</li>)}</ol>);
          } else {
            out.push(<p key={j}>{group.join(" ")}</p>);
          }
        }
        return <div key={i} className="space-y-3">{out}</div>;
      })}
    </div>
  );
}
