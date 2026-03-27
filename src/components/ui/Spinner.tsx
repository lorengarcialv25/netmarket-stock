import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

export function Spinner({ size = "md", className, label }: SpinnerProps) {
  const sizeClasses = {
    sm: "size-4 border-[2px]",
    md: "size-6 border-[2.5px]",
    lg: "size-8 border-[3px]",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div
        className={cn(
          "rounded-full border-primary/25 border-t-primary animate-spin",
          sizeClasses[size]
        )}
      />
      {label && (
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          {label}
        </p>
      )}
    </div>
  );
}

export function PageLoader({ label = "Cargando..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size="lg" label={label} />
    </div>
  );
}
