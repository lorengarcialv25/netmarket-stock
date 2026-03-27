"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  showAction?: boolean;
  extraActions?: React.ReactNode;
}

export function PageHeader({ icon, title, actionLabel, onAction, showAction = true, extraActions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-3">
        {icon}
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {extraActions}
        {showAction && actionLabel && onAction && (
          <Button onClick={onAction}>
            <Plus size={16} />
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
