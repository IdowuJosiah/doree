import Link from "next/link";
import { adminDb } from "@/lib/auth";

export default async function AdminHome() {
  const db = await adminDb();
  const count = async (status: string) =>
    (await db.from("orders").select("id", { count: "exact", head: true }).eq("status", status)).count ?? 0;
  const [paid, pending] = await Promise.all([count("paid"), count("pending")]);

  return (
    <>
      <h1 className="font-display text-4xl uppercase">Admin</h1>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        <li className="border border-line p-6">
          <p className="label">To fulfil</p>
          <p className="font-display text-4xl">{paid}</p>
          <Link href="/admin/orders?status=paid" className="text-link text-sm">View paid orders</Link>
        </li>
        <li className="border border-line p-6">
          <p className="label">Awaiting payment</p>
          <p className="font-display text-4xl">{pending}</p>
          <Link href="/admin/orders?status=pending" className="text-link text-sm">View pending orders</Link>
        </li>
      </ul>
    </>
  );
}
