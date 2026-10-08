"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

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

  async function handle(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    try {
      const storage = createBrowserSupabase().storage.from("media");
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) throw new Error(`${file.name} is not an image.`);
        if (file.size > MAX_BYTES) throw new Error(`${file.name} is larger than 25 MB.`);
        const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
        const path = `${folder}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await storage.upload(path, file, { contentType: file.type, cacheControl: "31536000" });
        if (uploadError) throw new Error(uploadError.message);
        urls.push(storage.getPublicUrl(path).data.publicUrl);
      }
      await onUploaded(urls);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label className="btn-outline cursor-pointer !min-h-[40px] !px-5 !py-2">
        {busy ? "Uploading…" : label}
        <input
          type="file"
          accept="image/*"
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
