import type { Metadata } from "next";
import { adminDb } from "@/lib/auth";
import { siteConfig } from "@/lib/config";
import { Notice, Small } from "../_components/ui";
import { deleteMessage } from "./actions";

export const metadata: Metadata = { title: "Messages" };

type Message = { id: string; name: string; email: string; message: string; created_at: string };

export default async function MessagesPage({ searchParams }: { searchParams: { error?: string; saved?: string } }) {
  const db = await adminDb();
  const { data, count } = await db
    .from("contact_messages")
    .select("id, name, email, message, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(500)
    .returns<Message[]>();
  const list = data ?? [];

  return (
    <>
      <h1 className="font-display text-4xl uppercase">Messages</h1>
      <p className="mb-6 mt-2">
        {count ?? 0} {count === 1 ? "message" : "messages"} from the contact page. Each one is also emailed to you when it arrives.
      </p>
      <Notice searchParams={searchParams} />
      <ul className="space-y-6">
        {list.map((m) => (
          <li key={m.id} className="border border-line p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="font-medium">{m.name}</p>
              <p className="text-sm opacity-70">{new Date(m.created_at).toLocaleString("en-US")}</p>
            </div>
            <p className="text-sm">
              <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: your message to ${siteConfig.name}`)}`} className="text-link">
                {m.email}
              </a>
            </p>
            <p className="mt-4 whitespace-pre-line break-words">{m.message}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: your message to ${siteConfig.name}`)}`} className="btn-outline !min-h-[36px] !px-4 !py-1.5">
                Reply by email
              </a>
              <form action={deleteMessage.bind(null, m.id)}>
                <Small danger>Delete</Small>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
