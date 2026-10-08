"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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

  async function handle(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    try {
      const storage = createBrowserSupabase().storage.from("media");
      const urls: string[] = [];
      const failed: string[] = [];
      for (const file of Array.from(files)) {
        try {
          if (!looksLikeImage(file)) throw new Error(`${file.name} is not an image.`);
          if (file.size > MAX_BYTES) throw new Error(`${file.name} is larger than 25 MB.`);
          const id = crypto.randomUUID();
          const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
          setStatus(`Preparing ${file.name}…`);
          const web = await webVersion(file);

          setStatus(`Uploading ${file.name}…`);
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
        await onUploaded(urls);
        router.refresh();
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
      <label className="btn-outline cursor-pointer !min-h-[40px] !px-5 !py-2">
        {busy ? status || "Working…" : label}
        <input
          type="file"
          accept="image/*,.heic,.heif"
          multiple={multiple}
          disabled={busy}
          className="sr-only"
          onChange={(e) => {
            void handle(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      {error && <p role="alert" className="mt-2 text-sm text-red-800">{error}</p>}
    </div>
  );
}
