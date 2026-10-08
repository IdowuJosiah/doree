import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section container-page text-center">
      <h1 className="display-xl">Page not found</h1>
      <p className="mt-6">The page you are looking for has moved or does not exist.</p>
      <Link href="/" className="btn-outline mt-8">
        Back home
      </Link>
    </section>
  );
}
