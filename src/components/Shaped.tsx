import Image from "next/image";
import type { ProductImage } from "@/lib/data/catalog";

export type Shape = "arch" | "quarter" | "quarter-mirror" | "rect";

type Props = {
  image: ProductImage;
  shape: Shape;
  priority?: boolean;
  sizes?: string;
  className?: string;
};

export function Shaped({ image, shape, priority, sizes = "(min-width: 1024px) 33vw, 50vw", className = "" }: Props) {
  return (
    <div className={`shape shape-${shape} bg-cream-deep ${className}`}>
      {image.src ? (
        <Image
          src={image.src}
          alt={image.alt}
          fill
          priority={priority}
          sizes={sizes}
          style={{ objectFit: "cover", objectPosition: image.objectPosition ?? "center" }}
        />
      ) : (
        <div className="placeholder flex items-end justify-center bg-cream-deep pb-6" role="img" aria-label={image.alt}>
          <span className="block h-px w-10 bg-gold" />
        </div>
      )}
    </div>
  );
}
