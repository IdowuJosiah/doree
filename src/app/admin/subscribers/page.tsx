import type { Metadata } from "next";
import { adminDb } from "@/lib/auth";

export const metadata: Metadata = { title: "Subscribers" };

const sources: Record<string, string> = { coming_soon: "Coming soon", newsletter: "Newsletter" };

export default async function SubscribersPage() {
  const db = await adminDb();
  const { data, count } = await db
    .from("subscribers")
    .select("email, source, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(1000);
  const list = data ?? [];

  return (
    <>
      <h1 className="font-display text-4xl uppercase">Subscribers</h1>
      <p className="mb-6 mt-2">{count ?? 0} people have signed up from the home page.</p>
      {list.length > 0 && (
        <>
          <label htmlFor="all-emails" className="label mb-1 block">All emails, ready to copy</label>
          <textarea id="all-emails" readOnly rows={3} value={list.map((s) => s.email).join(", ")} className="field !h-auto mb-8 py-2 text-sm" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead className="label border-b border-line">
                <tr><th className="py-2">Email</th><th>Signed up from</th><th>Date</th></tr>
              </thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s.email} className="border-b border-line">
                    <td className="py-2">{s.email}</td>
                    <td>{sources[s.source] ?? s.source}</td>
                    <td>{new Date(s.created_at).toLocaleDateString("en-US")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
