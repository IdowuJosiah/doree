// Shown straight away while an admin page loads, so a click never looks ignored.
export default function AdminLoading() {
  return (
    <div role="status" className="flex items-center gap-3 py-10 text-sm opacity-70">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-gold border-t-transparent" aria-hidden="true" />
      Loading…
    </div>
  );
}
