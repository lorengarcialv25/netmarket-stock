"use client";

import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

const variantStyles = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
  green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
  red: "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400",
};

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  variant: keyof typeof variantStyles;
  href?: string;
}

export function StatsCard({ icon, label, value, variant, href }: StatsCardProps) {
  const content = (
    <Card className={`hover:shadow-md transition-shadow ${href ? "cursor-pointer" : ""}`}>
      <CardContent className="flex items-center gap-4">
        <div className={`size-12 rounded-lg flex items-center justify-center shrink-0 ${variantStyles[variant]}`}>
          {icon}
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            {label}
          </div>
          <div className={`text-2xl font-bold leading-none ${variant === "red" ? "text-destructive" : "text-foreground"}`}>
            {value}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }
  return content;
}
