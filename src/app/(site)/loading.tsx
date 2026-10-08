// Shown while a page loads: cream-deep blocks in the shapes of the content.
export default function Loading() {
  return (
    <section className="section container-page" aria-busy="true" aria-label="Loading">
      <div className="h-16 w-2/3 max-w-md animate-pulse bg-cream-deep" />
      <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse bg-cream-deep" style={{ borderRadius: "9999px 9999px 0 0" }} />
        ))}
      </div>
    </section>
  );
}
