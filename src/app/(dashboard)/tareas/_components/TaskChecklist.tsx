"use client";

import { useState } from "react";
import { CheckSquare, Plus, Trash2, Square, SquareCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChecklistItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TaskChecklistProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
  readOnly?: boolean;
}

export function TaskChecklist({ items, onChange, readOnly }: TaskChecklistProps) {
  const [newText, setNewText] = useState("");

  const completed = items.filter((i) => i.completed).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleToggle = (id: string) => {
    onChange(items.map((i) => (i.id === id ? { ...i, completed: !i.completed } : i)));
  };

  const handleDelete = (id: string) => {
    onChange(items.filter((i) => i.id !== id));
  };

  const handleAdd = () => {
    const text = newText.trim();
    if (!text) return;
    const item: ChecklistItem = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      created_at: new Date().toISOString(),
    };
    onChange([...items, item]);
    setNewText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CheckSquare size={16} className="text-muted-foreground" />
        <h4 className="text-sm font-medium text-foreground">Checklist</h4>
        {total > 0 && (
          <span className="text-xs text-muted-foreground ml-auto">
            {completed}/{total}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              pct === 100 ? "bg-green-500" : "bg-primary"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* Items */}
      <div className="space-y-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="group flex items-start gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors"
          >
            <button
              onClick={() => !readOnly && handleToggle(item.id)}
              className="mt-0.5 shrink-0 cursor-pointer"
              disabled={readOnly}
            >
              {item.completed ? (
                <SquareCheck size={16} className="text-primary" />
              ) : (
                <Square size={16} className="text-muted-foreground" />
              )}
            </button>
            <span
              className={cn(
                "text-sm flex-1 leading-snug",
                item.completed && "line-through text-muted-foreground"
              )}
            >
              {item.text}
            </span>
            {!readOnly && (
              <button
                onClick={() => handleDelete(item.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-0.5 rounded hover:bg-destructive/10 cursor-pointer"
              >
                <Trash2 size={13} className="text-destructive" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add new */}
      {!readOnly && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nuevo elemento..."
            className="flex-1 text-sm bg-transparent border-b border-border focus:border-primary outline-none py-1.5 px-1 placeholder:text-muted-foreground/60"
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleAdd}
            disabled={!newText.trim()}
          >
            <Plus size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}

export function ChecklistProgress({ items }: { items: ChecklistItem[] }) {
  if (!items || items.length === 0) return null;
  const completed = items.filter((i) => i.completed).length;
  const total = items.length;
  const pct = Math.round((completed / total) * 100);

  return (
    <div className="flex items-center gap-1.5">
      <div className="w-10 h-1 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full",
            pct === 100 ? "bg-green-500" : "bg-primary"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground">{completed}/{total}</span>
    </div>
  );
}
