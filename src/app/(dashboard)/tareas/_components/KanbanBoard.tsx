"use client";

import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  Calendar,
  Paperclip,
  MessageSquare,
  GripVertical,
  Plus,
  Wrench,
  Package,
  AlertTriangle,
  FileText,
  X,
} from "lucide-react";
import type { Task, TaskStatus, TaskPriority, TaskType, TaskStatusColumn } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChecklistProgress } from "./TaskChecklist";

// Color presets for tags
const TAG_COLORS = [
  "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500",
  "bg-lime-500", "bg-green-500", "bg-emerald-500", "bg-teal-500",
  "bg-cyan-500", "bg-sky-500", "bg-blue-500", "bg-indigo-500",
  "bg-violet-500", "bg-purple-500", "bg-fuchsia-500", "bg-pink-500",
];

function getTagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

const priorityConfig: Record<TaskPriority, { label: string; className: string; dot: string }> = {
  urgente: { label: "Urgente", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", dot: "bg-red-500" },
  alta: { label: "Alta", className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", dot: "bg-orange-500" },
  media: { label: "Media", className: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400", dot: "bg-sky-500" },
  baja: { label: "Baja", className: "bg-slate-100 text-slate-600 dark:bg-slate-800/30 dark:text-slate-400", dot: "bg-slate-400" },
};

const taskTypeIcons: Record<TaskType, { icon: typeof FileText; color: string }> = {
  manual: { icon: FileText, color: "text-slate-400" },
  fabricacion: { icon: Wrench, color: "text-purple-500" },
  reposicion: { icon: Package, color: "text-orange-500" },
  auto_stock_bajo: { icon: AlertTriangle, color: "text-red-500" },
};

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

interface KanbanBoardProps {
  tasks: Task[];
  columns: TaskStatusColumn[];
  onStatusChange: (task: Task, newStatus: TaskStatus) => void;
  onOpen: (task: Task) => void;
  onDelete: (id: string) => void;
  onQuickAdd: (title: string, status: string) => void;
  canManage: boolean;
}

export function KanbanBoard({
  tasks,
  columns,
  onStatusChange,
  onOpen,
  onDelete,
  onQuickAdd,
  canManage,
}: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const dragCounter = useRef<Record<string, number>>({});

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = "0.5";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = "1";
    setDraggedTask(null);
    setDragOverColumn(null);
    dragCounter.current = {};
  };

  const handleDragEnter = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    dragCounter.current[status] = (dragCounter.current[status] || 0) + 1;
    setDragOverColumn(status);
  };

  const handleDragLeave = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    dragCounter.current[status] = (dragCounter.current[status] || 0) - 1;
    if (dragCounter.current[status] <= 0) {
      dragCounter.current[status] = 0;
      if (dragOverColumn === status) setDragOverColumn(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    dragCounter.current = {};
    setDragOverColumn(null);
    if (draggedTask && draggedTask.status !== status) {
      onStatusChange(draggedTask, status);
    }
    setDraggedTask(null);
  };

  const gridCols = columns.length <= 4
    ? `grid-cols-1 sm:grid-cols-2 lg:grid-cols-${columns.length}`
    : `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-${Math.min(columns.length, 6)}`;

  return (
    <div>
      <div className={cn("grid gap-4 min-h-[400px]", gridCols)} style={
        columns.length > 4 ? { gridTemplateColumns: `repeat(${columns.length}, minmax(260px, 1fr))` } : undefined
      }>
        {columns.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.name);
          const isOver = dragOverColumn === col.name && draggedTask?.status !== col.name;

          return (
            <div
              key={col.name}
              className={cn(
                "rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col",
                isOver ? "border-solid ring-2 ring-primary/20 scale-[1.01]" : "border-border"
              )}
              style={{ borderColor: isOver ? col.color : undefined }}
              onDragEnter={(e) => handleDragEnter(e, col.name)}
              onDragLeave={(e) => handleDragLeave(e, col.name)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.name)}
            >
              {/* Column header */}
              <div className="px-3 py-2.5 rounded-t-[10px] border-b" style={{ backgroundColor: `${col.color}15` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                    <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground bg-background/80 px-2 py-0.5 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-380px)]">
                {columnTasks.length === 0 && (
                  <div className={cn(
                    "text-center text-xs text-muted-foreground py-8 rounded-lg transition-colors",
                    isOver ? "bg-primary/5" : ""
                  )}>
                    {isOver ? "Soltar aqui" : "Sin tareas"}
                  </div>
                )}
                {columnTasks.map((task) => (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onOpen={onOpen}
                    onDelete={onDelete}
                    isDragging={draggedTask?.id === task.id}
                  />
                ))}
              </div>

              {/* Quick add */}
              {canManage && (
                <QuickAddCard status={col.name} onAdd={onQuickAdd} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuickAddCard({ status, onAdd }: { status: string; onAdd: (title: string, status: string) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpen = () => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSubmit = () => {
    const val = title.trim();
    if (!val) return;
    onAdd(val, status);
    setTitle("");
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); handleSubmit(); }
    if (e.key === "Escape") { setTitle(""); setOpen(false); }
  };

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 w-full px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors rounded-b-xl cursor-pointer"
      >
        <Plus size={14} />
        Añadir tarea
      </button>
    );
  }

  return (
    <div className="p-2 border-t border-border">
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (!title.trim()) setOpen(false); }}
        placeholder="Titulo de la tarea..."
        className="w-full text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:border-primary placeholder:text-muted-foreground/50"
      />
      <div className="flex items-center gap-2 mt-2">
        <Button size="sm" className="h-7 text-xs" onClick={handleSubmit} disabled={!title.trim()}>
          Añadir
        </Button>
        <button onClick={() => { setTitle(""); setOpen(false); }} className="p-1 rounded hover:bg-muted cursor-pointer">
          <X size={14} className="text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

function KanbanCard({
  task,
  onDragStart,
  onDragEnd,
  onOpen,
  onDelete,
  isDragging,
}: {
  task: Task;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onOpen: (task: Task) => void;
  onDelete: (id: string) => void;
  isDragging: boolean;
}) {
  const pri = priorityConfig[task.priority] || priorityConfig.media;
  const taskType = (task.task_type || "manual") as TaskType;
  const typeInfo = taskTypeIcons[taskType] || taskTypeIcons.manual;
  const TypeIcon = typeInfo.icon;

  const isOverdue = (() => {
    if (!task.due_date || task.status === "completada" || task.status === "cancelada") return false;
    const date = new Date(task.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  })();

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(task)}
      className={cn(
        "group rounded-lg border border-border bg-card p-3 cursor-pointer active:cursor-grabbing transition-all hover:shadow-md hover:border-primary/30",
        isDragging && "opacity-50 rotate-1 shadow-lg"
      )}
    >
      {/* Color tags bar */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-2">
          {task.tags.slice(0, 4).map((tag) => (
            <div
              key={tag}
              className={cn("h-2 rounded-full min-w-[32px]", getTagColor(tag.trim()))}
              title={tag.trim()}
            />
          ))}
        </div>
      )}

      {/* Top row: type icon + priority + drag */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <GripVertical size={14} className="text-muted-foreground/40 shrink-0 group-hover:text-muted-foreground cursor-grab" />
          {taskType !== "manual" && (
            <TypeIcon size={13} className={typeInfo.color} />
          )}
        </div>
        <Badge className={cn("text-[10px] h-4 px-1.5", pri.className)}>{pri.label}</Badge>
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-foreground leading-tight line-clamp-2 mb-1">
        {task.title}
      </p>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{task.description}</p>
      )}

      {/* Checklist progress */}
      {task.checklist && task.checklist.length > 0 && (
        <div className="mb-2">
          <ChecklistProgress items={task.checklist} />
        </div>
      )}

      {/* Footer: meta + avatar */}
      <div className="flex items-center justify-between pt-1.5 border-t border-border/50">
        <div className="flex items-center gap-2.5">
          {task.due_date && (
            <span className={cn("flex items-center gap-1 text-[11px]", isOverdue ? "text-red-500 font-medium" : "text-muted-foreground")}>
              <Calendar size={11} />
              {new Date(task.due_date).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
            </span>
          )}
          {(task.attachment_count ?? 0) > 0 && (
            <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
              <Paperclip size={10} />
              {task.attachment_count}
            </span>
          )}
          {(task.comment_count ?? 0) > 0 && (
            <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
              <MessageSquare size={10} />
              {task.comment_count}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Avatar */}
          {task.assigned_to_name && (
            <div
              className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-semibold"
              title={task.assigned_to_name}
            >
              {getInitials(task.assigned_to_name)}
            </div>
          )}
          {/* Delete on hover */}
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          >
            <Trash2 size={12} className="text-destructive" />
          </button>
        </div>
      </div>
    </div>
  );
}
