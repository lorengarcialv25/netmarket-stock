"use client";

import { useStorageUrl } from "@/hooks/useStorageUrl";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  filePath: string | null | undefined;
  alt: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "size-10",
  md: "size-12",
  lg: "size-32",
};

const iconSizes = { sm: 16, md: 20, lg: 32 };

export function ProductImage({ filePath, alt, className, size = "md" }: ProductImageProps) {
  const url = useStorageUrl(filePath);

  if (url) {
    return (
      <img
        src={url}
        alt={alt}
        className={cn("rounded-lg object-cover border border-border shrink-0", sizeClasses[size], className)}
      />
    );
  }

  return (
    <div className={cn("rounded-lg bg-muted flex items-center justify-center shrink-0", sizeClasses[size], className)}>
      <Package size={iconSizes[size]} className="text-muted-foreground" />
    </div>
  );
}
