import type { Metadata } from "next";
import { adminDb } from "@/lib/auth";
import { Card, Notice } from "../_components/ui";
import { deleteUnusedFiles } from "./actions";
import { scanStorage } from "./scan";

export const metadata: Metadata = { title: "Storage" };

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;

export default async function StoragePage(props: { searchParams: Promise<{ error?: string; removed?: string }> }) {
  const searchParams = await props.searchParams;
  const db = await adminDb();
  let scan: Awaited<ReturnType<typeof scanStorage>> | null = null;
  let scanError = "";
  try {
    scan = await scanStorage(db);
  } catch (e) {
    scanError = e instanceof Error ? e.message : "Could not read storage.";
  }

  return (
    <>
      <h1 className="font-display text-4xl uppercase">Storage</h1>
      <p className="mb-6 mt-2 max-w-2xl">
        Photos are stored in Supabase, whose free plan allows 1 GB. Files that nothing on the site uses any more (from deleted products, replaced photos, and the full-size originals the site used to keep) can be cleared here.
      </p>
      <Notice searchParams={searchParams} />
      {searchParams.removed && (
        <p role="status" className="mb-6 border border-gold px-4 py-3 text-sm text-gold-text">
          Deleted {searchParams.removed} unused {searchParams.removed === "1" ? "file" : "files"}. Supabase can take up to an hour to update its usage figure.
        </p>
      )}
      {scanError && <p role="alert" className="mb-6 border border-red-800 px-4 py-3 text-sm text-red-800">{scanError}</p>}

      {scan && (
        <>
          <ul className="mb-10 grid gap-4 sm:grid-cols-2">
            <li className="border border-line p-5">
              <p className="label">Photos stored</p>
              <p className="font-display text-3xl">{mb(scan.totalBytes)}</p>
              <p className="text-xs opacity-70">{scan.totalCount} files</p>
            </li>
            <li className="border border-line p-5">
              <p className="label">Not used anywhere</p>
              <p className="font-display text-3xl text-gold-text">{mb(scan.unusedBytes)}</p>
              <p className="text-xs opacity-70">{scan.unused.length} files</p>
            </li>
          </ul>

          <Card
            title="Clear unused files"
            hint="Deletes only files that no product, collection, category or site content uses. Photos uploaded in the last hour are skipped. This cannot be undone."
          >
            {scan.unused.length === 0 ? (
              <p>Nothing to clear.</p>
            ) : (
              <form action={deleteUnusedFiles}>
                <button type="submit" className="btn-primary">Delete {scan.unused.length} unused {scan.unused.length === 1 ? "file" : "files"} ({mb(scan.unusedBytes)})</button>
              </form>
            )}
          </Card>
        </>
      )}
    </>
  );
}
