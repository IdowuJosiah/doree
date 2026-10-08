import Image from "next/image";

// Fills its positioned parent with a photo, or a cream-deep block until one
// has been uploaded in the admin.
export function Cover({
  src,
  alt,
  priority,
  sizes = "100vw",
  className = "",
}: {
  src?: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  if (!src) return <div className={`absolute inset-0 bg-cream-deep ${className}`} role="img" aria-label={alt} />;
  return <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className={`object-cover ${className}`} />;
}
