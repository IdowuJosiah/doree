import Image from "next/image";

const RATIO = 251.111 / 78.029;

type Props = {
  color?: "ink" | "cream" | "olive" | "black";
  height?: number;
  className?: string;
  priority?: boolean;
};

// Wordmark is shown at exactly its aspect ratio; never stretch or recolour.
export function Logo({ color = "ink", height = 32, className, priority }: Props) {
  return (
    <Image
      src={`/brand/doree-logo-${color}.svg`}
      alt="Dorée"
      width={Math.round(height * RATIO)}
      height={height}
      priority={priority}
      className={className}
      style={{ height, width: "auto" }}
    />
  );
}
