"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";

interface CategoryHeaderProps {
  name: string;
  description: string | null;
  canManage: boolean;
  onEdit: () => void;
}

export function CategoryHeader({ name, description, canManage, onEdit }: CategoryHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/categorias")}>
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{name}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {canManage && (
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil size={14} />
          Editar
        </Button>
      )}
    </div>
  );
}
