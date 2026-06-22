import { useState } from "react";
import { ImageIcon } from "lucide-react";

interface SafeImageProps {
  src: string | undefined;
  alt: string;
  className?: string;
  fallbackText?: string;
}

export function SafeImage({ src, alt, className = "", fallbackText = "Image unavailable" }: SafeImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (!src || error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-muted ${className}`}>
        <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
        <span className="mt-1 text-xs text-muted-foreground">{fallbackText}</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`h-full w-full object-cover transition-opacity duration-300 ${loading ? "opacity-0" : "opacity-100"} ${className}`}
        onError={() => setError(true)}
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}
