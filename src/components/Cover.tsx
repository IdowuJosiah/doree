import Image from "next/image";
import { framingStyle } from "@/lib/framing";

// Fills its positioned parent with a photo, or a cream-deep block until one
// has been uploaded in the admin.
export function Cover({
  src,
  alt,
  priority,
  sizes = "100vw",
  className = "",
  framing,
}: {
  src?: string;
  /** How the photo sits in its frame (focus point and zoom), set in the admin. */
  framing?: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  if (!src) return <div className={`absolute inset-0 bg-cream-deep ${className}`} role="img" aria-label={alt} />;
  return (
    <div className="absolute inset-0 overflow-hidden">
      <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className={className} style={framingStyle(framing)} />
    </div>
  );
}
