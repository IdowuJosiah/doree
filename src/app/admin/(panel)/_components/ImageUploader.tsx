"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { looksLikeImage, webVersion } from "./prepare-image";

const MAX_BYTES = 25 * 1024 * 1024;

// Uploads originals straight to Supabase Storage as the signed-in admin (the
// bucket's row-level security rejects anyone else), then hands the public
// URLs to a server action that saves them.
export function ImageUploader({
  folder,
  onUploaded,
  multiple = false,
  label = "Upload images",
}: {
  folder: string;
  onUploaded: (urls: string[]) => Promise<void>;
  multiple?: boolean;
  label?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [done, setDone] = useState("");
  const [dragging, setDragging] = useState(false);
  const [, startTransition] = useTransition();
  // Some browsers fire "input", some "change", some both: handle each pick once.
  const lastPick = useRef<FileList | null>(null);

  function pick(input: HTMLInputElement) {
    const files = input.files;
    if (!files?.length || files === lastPick.current) return;
    lastPick.current = files;
    const list = Array.from(files); // copy before the input is cleared
    input.value = "";
    void handle(list);
  }

  async function handle(files: File[]) {
    if (!files.length || busy) return;
    setBusy(true);
    setError("");
    setDone("");
    try {
      const storage = createBrowserSupabase().storage.from("media");
      const urls: string[] = [];
      const failed: string[] = [];
      for (const [n, file] of files.entries()) {
        const of = files.length > 1 ? ` (${n + 1} of ${files.length})` : "";
        try {
          if (!looksLikeImage(file)) throw new Error(`${file.name} is not an image.`);
          if (file.size > MAX_BYTES) throw new Error(`${file.name} is larger than 25 MB.`);
          const id = crypto.randomUUID();
          const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
          setStatus(`Preparing photo${of}…`);
          const web = await webVersion(file);

          setStatus(`Uploading photo${of}…`);
          // The original is kept as uploaded; the site shows the web version.
          const original = await storage.upload(`originals/${folder}/${id}.${ext}`, file, { contentType: file.type || "application/octet-stream" });
          if (original.error) throw new Error(`${file.name}: ${original.error.message}`);
          const path = `${folder}/${id}.jpg`;
          const { error: uploadError } = await storage.upload(path, web, { contentType: "image/jpeg", cacheControl: "31536000" });
          if (uploadError) throw new Error(`${file.name}: ${uploadError.message}`);
          urls.push(storage.getPublicUrl(path).data.publicUrl);
        } catch (e) {
          // Keep going: one bad file should not lose the others.
          failed.push(e instanceof Error ? e.message : `${file.name} could not be uploaded.`);
        }
      }
      if (urls.length) {
        setStatus("Saving…");
        await onUploaded(urls);
        startTransition(() => router.refresh());
        setDone(urls.length === 1 ? "Photo added." : `${urls.length} photos added.`);
      }
      if (failed.length) setError(failed.join(" "));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      setStatus("");
    }
  }

  return (
    <div>
      <label
        className={`flex cursor-pointer flex-col items-center justify-center gap-1 border border-dashed px-5 py-5 text-center transition ${dragging ? "border-gold-text bg-cream-deep" : "border-gold hover:border-gold-text hover:bg-cream-deep"} ${busy ? "cursor-wait opacity-80" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handle(Array.from(e.dataTransfer.files));
        }}
      >
        <span className="label">{busy ? status || "Working…" : label}</span>
        {!busy && <span className="text-xs opacity-70">Click to choose {multiple ? "photos" : "a photo"}, or drag {multiple ? "them" : "it"} here</span>}
        <input
          type="file"
          accept="image/*,.heic,.heif"
          multiple={multiple}
          disabled={busy}
          className="sr-only"
          onChange={(e) => pick(e.currentTarget)}
          onInput={(e) => pick(e.currentTarget)}
        />
      </label>
      {done && !busy && <p role="status" className="mt-2 text-sm text-gold-text">{done}</p>}
      {error && <p role="alert" className="mt-2 text-sm text-red-800">{error}</p>}
    </div>
  );
}
