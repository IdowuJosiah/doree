"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
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
  const input = useRef<HTMLInputElement>(null);
  // Safari exports photos picked from the Photos library (downloading them
  // from iCloud if needed) before handing them over, which can take a while
  // with nothing on screen. "waiting" covers that gap.
  const [waiting, setWaiting] = useState<false | "short" | "long">(false);
  const opened = useRef(false);

  useEffect(() => {
    const el = input.current;
    const stop = () => {
      opened.current = false;
      setWaiting(false);
    };
    // The dialog has closed when the window gets focus back.
    const onFocus = () => {
      if (!opened.current) return;
      setTimeout(() => {
        if (opened.current) setWaiting("short");
      }, 600);
    };
    window.addEventListener("focus", onFocus);
    el?.addEventListener("cancel", stop);
    return () => {
      window.removeEventListener("focus", onFocus);
      el?.removeEventListener("cancel", stop);
    };
  }, []);

  useEffect(() => {
    if (waiting !== "short") return;
    const t = setTimeout(() => setWaiting("long"), 15000);
    return () => clearTimeout(t);
  }, [waiting]);

  function pick(input: HTMLInputElement) {
    const files = input.files;
    if (!files?.length || files === lastPick.current) return;
    lastPick.current = files;
    opened.current = false;
    setWaiting(false);
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
        <span className="label">{busy ? status || "Working…" : waiting ? "Getting your photos…" : label}</span>
        {!busy && !waiting && <span className="text-xs opacity-70">Click to choose {multiple ? "photos" : "a photo"}, or drag {multiple ? "them" : "it"} here</span>}
        {!busy && waiting && (
          <span className="text-xs opacity-70">Photos from the Photos library can take a few seconds to arrive, longer if they are stored in iCloud.</span>
        )}
        <input
          ref={input}
          type="file"
          accept="image/*,.heic,.heif"
          multiple={multiple}
          disabled={busy}
          className="sr-only"
          onClick={() => {
            opened.current = true;
            setWaiting(false);
          }}
          onChange={(e) => pick(e.currentTarget)}
          onInput={(e) => pick(e.currentTarget)}
        />
      </label>
      {waiting === "long" && !busy && (
        <div role="status" className="mt-2 text-sm">
          <p>Still waiting for Safari to hand over the photos. If nothing happens, open the Photos app, select the photos and drag them into this box; that is usually quickest.</p>
          <button type="button" onClick={() => { opened.current = false; setWaiting(false); }} className="text-link mt-1">Stop waiting</button>
        </div>
      )}
      {done && !busy && <p role="status" className="mt-2 text-sm text-gold-text">{done}</p>}
      {error && <p role="alert" className="mt-2 text-sm text-red-800">{error}</p>}
    </div>
  );
}
