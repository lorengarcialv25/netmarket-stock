"use client";

import Link from "next/link";
import {
  CheckSquare,
  Calendar,
  ArrowRight,
  CircleCheck,
  Clock,
  AlertTriangle,
  Flag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Task, TaskPriority } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MyTasksWidgetProps {
  tasks: Task[];
}

const priorityConfig: Record<TaskPriority, { label: string; className: string; dot: string }> = {
  urgente: { label: "Urgente", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", dot: "bg-red-500" },
  alta: { label: "Alta", className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", dot: "bg-orange-500" },
  media: { label: "Media", className: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400", dot: "bg-sky-500" },
  baja: { label: "Baja", className: "bg-slate-100 text-slate-600 dark:bg-slate-800/30 dark:text-slate-400", dot: "bg-slate-400" },
};

export function MyTasksWidget({ tasks }: MyTasksWidgetProps) {
  const overdue = tasks.filter((t) => {
    if (!t.due_date) return false;
    const d = new Date(t.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  });

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-2">
          <CheckSquare size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Mis Tareas</h3>
          {tasks.length > 0 && (
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {tasks.length}
            </span>
          )}
        </div>
        <Link
          href="/tareas"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          Ver todas <ArrowRight size={12} />
        </Link>
      </div>

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <div className="px-5 py-2 bg-red-50 dark:bg-red-950/20 border-b border-red-200 dark:border-red-900/30">
          <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 font-medium">
            <AlertTriangle size={13} />
            {overdue.length} tarea{overdue.length > 1 ? "s" : ""} vencida{overdue.length > 1 ? "s" : ""}
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="divide-y divide-border">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CircleCheck size={32} className="text-green-500 mb-2" />
            <p className="text-sm font-medium text-foreground">Todo al dia</p>
            <p className="text-xs text-muted-foreground mt-0.5">No tienes tareas pendientes</p>
          </div>
        ) : (
          tasks.slice(0, 8).map((task) => {
            const pri = priorityConfig[task.priority] || priorityConfig.media;
            const isOverdue = (() => {
              if (!task.due_date) return false;
              const d = new Date(task.due_date);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return d < today;
            })();

            return (
              <Link
                key={task.id}
                href="/tareas"
                className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors group"
              >
                {/* Priority dot */}
                <div className={cn("w-2 h-2 rounded-full shrink-0", pri.dot)} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {/* Status */}
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      {task.status === "en_progreso" ? (
                        <><Clock size={10} /> En progreso</>
                      ) : (
                        <><Flag size={10} /> Pendiente</>
                      )}
                    </span>
                    {/* Due date */}
                    {task.due_date && (
                      <span className={cn(
                        "flex items-center gap-1 text-[11px]",
                        isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"
                      )}>
                        <Calendar size={10} />
                        {new Date(task.due_date).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Priority badge */}
                <Badge className={cn("text-[10px] h-4 px-1.5 shrink-0", pri.className)}>
                  {pri.label}
                </Badge>
              </Link>
            );
          })
        )}
      </div>

      {/* Footer with count */}
      {tasks.length > 8 && (
        <div className="px-5 py-2.5 border-t border-border text-center">
          <Link href="/tareas" className="text-xs text-primary hover:underline">
            +{tasks.length - 8} tareas mas
          </Link>
        </div>
      )}
    </div>
  );
}
