import Image from "next/image";

interface ArtworkImageProps {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
  width?: number | null;
  height?: number | null;
  className?: string;
}

/** Muestra la imagen con su proporción original, sin recortar ni deformar. */
export function ArtworkImage({
  src,
  alt,
  priority,
  sizes,
  width,
  height,
  className = "",
}: ArtworkImageProps) {
  const baseClass = `block h-auto w-full max-w-full ${className}`.trim();

  if (width && height && width > 0 && height > 0) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        sizes={sizes}
        className={baseClass}
        style={{ width: "100%", height: "auto" }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={baseClass}
    />
  );
}
