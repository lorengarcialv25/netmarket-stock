"use client";

import { useState, useRef, useEffect } from "react";
import {
  Trash2,
  Calendar,
  Paperclip,
  MessageSquare,
  Wrench,
  Package,
  AlertTriangle,
  FileText,
  ChevronDown,
} from "lucide-react";
import type { Task, TaskPriority, TaskType, TaskStatusColumn } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChecklistProgress } from "./TaskChecklist";

const priorityConfig: Record<string, { label: string; dot: string }> = {
  urgente: { label: "Urgente", dot: "bg-red-500" },
  alta: { label: "Alta", dot: "bg-orange-500" },
  media: { label: "Media", dot: "bg-sky-500" },
  baja: { label: "Baja", dot: "bg-slate-400" },
};

const taskTypeConfig: Record<string, { icon: typeof FileText; color: string }> = {
  manual: { icon: FileText, color: "text-slate-400" },
  fabricacion: { icon: Wrench, color: "text-purple-500" },
  reposicion: { icon: Package, color: "text-orange-500" },
  auto_stock_bajo: { icon: AlertTriangle, color: "text-red-500" },
};

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

interface TaskTableProps {
  tasks: Task[];
  columns: TaskStatusColumn[];
  loading: boolean;
  onOpen: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (task: Task, status: string) => void;
  onPriorityChange: (task: Task, priority: string) => void;
}

export function TaskTable({ tasks, columns, loading, onOpen, onDelete, onStatusChange, onPriorityChange }: TaskTableProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground text-sm">
        Cargando...
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground text-sm">
        No hay tareas
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_120px_110px_140px_120px_40px] gap-0 border-b border-border bg-muted/40">
        <HeaderCell>Tarea</HeaderCell>
        <HeaderCell>Estado</HeaderCell>
        <HeaderCell>Prioridad</HeaderCell>
        <HeaderCell>Asignado</HeaderCell>
        <HeaderCell>Fecha</HeaderCell>
        <HeaderCell />
      </div>
      {/* Rows */}
      <div className="divide-y divide-border">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            columns={columns}
            onOpen={onOpen}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
            onPriorityChange={onPriorityChange}
          />
        ))}
      </div>
    </div>
  );
}

function HeaderCell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="px-3 py-2.5 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
      {children}
    </div>
  );
}

function TaskRow({
  task,
  columns,
  onOpen,
  onDelete,
  onStatusChange,
  onPriorityChange,
}: {
  task: Task;
  columns: TaskStatusColumn[];
  onOpen: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (task: Task, status: string) => void;
  onPriorityChange: (task: Task, priority: string) => void;
}) {
  const statusCol = columns.find((c) => c.name === task.status);
  const pri = priorityConfig[task.priority] || priorityConfig.media;
  const taskType = (task.task_type || "manual") as TaskType;
  const typeInfo = taskTypeConfig[taskType] || taskTypeConfig.manual;
  const TypeIcon = typeInfo.icon;

  const isOverdue = (() => {
    if (!task.due_date) return false;
    if (statusCol?.is_terminal) return false;
    return new Date(task.due_date) < new Date(new Date().toDateString());
  })();

  return (
    <div className="grid grid-cols-[1fr_120px_110px_140px_120px_40px] gap-0 group hover:bg-muted/30 transition-colors">
      {/* Title cell - clickable */}
      <div
        className="px-3 py-2.5 flex items-start gap-2.5 cursor-pointer min-w-0"
        onClick={() => onOpen(task)}
      >
        {taskType !== "manual" && (
          <TypeIcon size={14} className={cn(typeInfo.color, "shrink-0 mt-0.5")} />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.description}</p>
          )}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {task.tags?.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] px-1.5 py-0 rounded bg-muted text-muted-foreground">{tag.trim()}</span>
            ))}
            {(task.attachment_count ?? 0) > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <Paperclip size={9} />{task.attachment_count}
              </span>
            )}
            {(task.comment_count ?? 0) > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <MessageSquare size={9} />{task.comment_count}
              </span>
            )}
            {task.checklist && task.checklist.length > 0 && (
              <ChecklistProgress items={task.checklist} />
            )}
          </div>
        </div>
      </div>

      {/* Status - inline select */}
      <div className="px-2 py-2.5 flex items-center">
        <InlineSelect
          value={task.status}
          options={columns.map((c) => ({
            value: c.name,
            label: c.label,
            dot: c.color,
          }))}
          onChange={(v) => onStatusChange(task, v)}
          renderValue={() => (
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium w-full"
              style={{ backgroundColor: `${statusCol?.color || "#6b7280"}18`, color: statusCol?.color || "#6b7280" }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusCol?.color }} />
              <span className="truncate">{statusCol?.label || task.status}</span>
              <ChevronDown size={10} className="ml-auto shrink-0 opacity-0 group-hover:opacity-60" />
            </div>
          )}
        />
      </div>

      {/* Priority - inline select */}
      <div className="px-2 py-2.5 flex items-center">
        <InlineSelect
          value={task.priority}
          options={[
            { value: "urgente", label: "Urgente", dot: "#ef4444" },
            { value: "alta", label: "Alta", dot: "#f97316" },
            { value: "media", label: "Media", dot: "#0ea5e9" },
            { value: "baja", label: "Baja", dot: "#94a3b8" },
          ]}
          onChange={(v) => onPriorityChange(task, v)}
          renderValue={() => (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium text-foreground/80 hover:bg-muted transition-colors w-full">
              <div className={cn("w-1.5 h-1.5 rounded-full", pri.dot)} />
              <span className="truncate">{pri.label}</span>
              <ChevronDown size={10} className="ml-auto shrink-0 opacity-0 group-hover:opacity-60" />
            </div>
          )}
        />
      </div>

      {/* Assigned */}
      <div className="px-3 py-2.5 flex items-center">
        {task.assigned_to_name ? (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[8px] font-bold shrink-0">
              {getInitials(task.assigned_to_name)}
            </div>
            <span className="text-xs text-foreground truncate">{task.assigned_to_name.split(" ")[0]}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        )}
      </div>

      {/* Due date */}
      <div className="px-3 py-2.5 flex items-center">
        {task.due_date ? (
          <div className={cn(
            "flex items-center gap-1 text-xs",
            isOverdue ? "text-red-600 dark:text-red-400 font-medium" : "text-foreground/70"
          )}>
            <Calendar size={11} className={isOverdue ? "text-red-500" : "text-muted-foreground"} />
            {new Date(task.due_date).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        )}
      </div>

      {/* Actions */}
      <div className="px-2 py-2.5 flex items-center justify-center">
        <button
          onClick={() => onDelete(task.id)}
          className="p-1 rounded hover:bg-destructive/10 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 size={13} className="text-destructive" />
        </button>
      </div>
    </div>
  );
}

// ---- Inline Select (Notion-style) ----
function InlineSelect({
  value,
  options,
  onChange,
  renderValue,
}: {
  value: string;
  options: { value: string; label: string; dot?: string }[];
  onChange: (value: string) => void;
  renderValue: () => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative w-full">
      <button onClick={() => setOpen(!open)} className="w-full cursor-pointer">
        {renderValue()}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-30 bg-card border border-border rounded-lg shadow-xl py-1 min-w-[140px] max-h-52 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={cn(
                "w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors cursor-pointer",
                opt.value === value && "bg-muted/60 font-medium"
              )}
            >
              {opt.dot && <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: opt.dot }} />}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
