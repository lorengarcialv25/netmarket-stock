"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Calendar,
  User,
  Tag,
  Flag,
  Wrench,
  Package,
  AlertTriangle,
  FileText,
  Trash2,
  CheckSquare,
  Link2,
  Warehouse,
  ChevronDown,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Task, TaskPriority, TaskType, ChecklistItem, AppUser, TaskStatusColumn } from "@/lib/types";
import { TaskChecklist } from "./TaskChecklist";
import { TaskAttachments } from "./TaskAttachments";
import { TaskComments } from "./TaskComments";

interface WarehouseOption {
  id: string;
  name: string;
}

interface TaskDetailPanelProps {
  task: Task;
  users: AppUser[];
  columns?: TaskStatusColumn[];
  warehouses?: WarehouseOption[];
  onUpdate: (updates: Partial<Task>) => void;
  onDelete: () => void;
  onClose: () => void;
  canManage: boolean;
}

const priorityConfig: Record<string, { label: string; dot: string }> = {
  urgente: { label: "Urgente", dot: "bg-red-500" },
  alta: { label: "Alta", dot: "bg-orange-500" },
  media: { label: "Media", dot: "bg-sky-500" },
  baja: { label: "Baja", dot: "bg-slate-400" },
};

const taskTypeConfig: Record<string, { label: string; icon: typeof FileText; color: string }> = {
  manual: { label: "Manual", icon: FileText, color: "text-slate-500" },
  fabricacion: { label: "Fabricacion", icon: Wrench, color: "text-purple-500" },
  reposicion: { label: "Reposicion", icon: Package, color: "text-orange-500" },
  auto_stock_bajo: { label: "Stock Bajo", icon: AlertTriangle, color: "text-red-500" },
};

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export function TaskDetailPanel({ task, users, columns, warehouses, onUpdate, onDelete, onClose, canManage }: TaskDetailPanelProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(task.title);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState(task.description || "");
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);
  useEffect(() => { if (editingTitle) titleRef.current?.focus(); }, [editingTitle]);
  useEffect(() => { if (editingDesc) descRef.current?.focus(); }, [editingDesc]);
  useEffect(() => { setTitleValue(task.title); setDescValue(task.description || ""); }, [task.title, task.description]);

  const saveTitle = () => {
    setEditingTitle(false);
    const val = titleValue.trim();
    if (val && val !== task.title) onUpdate({ title: val });
    else setTitleValue(task.title);
  };

  const saveDesc = () => {
    setEditingDesc(false);
    if (descValue !== (task.description || "")) onUpdate({ description: descValue || null });
  };

  const statusCol = columns?.find((c) => c.name === task.status);
  const statusLabel = statusCol?.label || task.status;
  const statusColor = statusCol?.color || "#6b7280";
  const pri = priorityConfig[task.priority] || priorityConfig.media;
  const typeConfig = taskTypeConfig[task.task_type || "manual"] || taskTypeConfig.manual;
  const TypeIcon = typeConfig.icon;
  const isOverdue = (() => {
    if (!task.due_date) return false;
    if (statusCol?.is_terminal) return false;
    return new Date(task.due_date) < new Date(new Date().toDateString());
  })();

  const hasChecklist = task.checklist && task.checklist.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[5vh]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-card rounded-xl shadow-2xl border border-border max-h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95">

        {/* ===== TOP HEADER BAR (full width) ===== */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0 rounded-t-xl" style={{ backgroundColor: `${statusColor}10` }}>
          {/* Left: status select + type */}
          <div className="flex items-center gap-2 text-xs">
            {/* Status as inline select */}
            <div className="relative">
              <button
                onClick={() => canManage && setOpenPopover(openPopover === "status" ? null : "status")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors",
                  canManage && "cursor-pointer hover:opacity-80"
                )}
                style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
                {statusLabel}
                {canManage && <ChevronDown size={11} className="opacity-60" />}
              </button>
              {openPopover === "status" && canManage && columns && (
                <div className="absolute top-full left-0 mt-1 z-30">
                  <PopoverMenu
                    onClose={() => setOpenPopover(null)}
                    items={columns.map((c) => ({
                      icon: <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />,
                      label: c.label,
                      onClick: () => { onUpdate({ status: c.name }); setOpenPopover(null); },
                    }))}
                  />
                </div>
              )}
            </div>
            {task.task_type && task.task_type !== "manual" && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <TypeIcon size={12} className={typeConfig.color} />
                <span>{typeConfig.label}</span>
              </div>
            )}
            {task.created_by_name && (
              <span className="text-muted-foreground">· por {task.created_by_name}</span>
            )}
          </div>
          {/* Right: delete + close */}
          <div className="flex items-center gap-1">
            {canManage && (
              <button onClick={onDelete} className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors cursor-pointer">
                <Trash2 size={15} className="text-muted-foreground hover:text-destructive" />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer">
              <X size={16} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* ===== TWO COLUMNS ===== */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* LEFT: Task content */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            {/* Title + chips + add menu */}
            <div className="px-6 pt-4 pb-0 shrink-0">
              {/* Title */}
              {editingTitle && canManage ? (
                <input
                  ref={titleRef}
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") { setTitleValue(task.title); setEditingTitle(false); } }}
                  className="text-xl font-bold text-foreground bg-transparent border-b-2 border-primary outline-none w-full"
                />
              ) : (
                <h2
                  onClick={() => canManage && setEditingTitle(true)}
                  className={cn("text-xl font-bold text-foreground", canManage && "cursor-pointer hover:text-primary/80 transition-colors")}
                >
                  {task.title}
                </h2>
              )}

              {/* Info chips */}
              <div className="flex items-center gap-1.5 flex-wrap mt-3 mb-1">
                {task.assigned_to_name && (
                  <Chip>
                    <div className="w-4 h-4 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[8px] font-bold">
                      {getInitials(task.assigned_to_name)}
                    </div>
                    <span>{task.assigned_to_name.split(" ")[0]}</span>
                  </Chip>
                )}
                {task.due_date && (
                  <Chip className={isOverdue ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : ""}>
                    <Calendar size={11} />
                    {new Date(task.due_date).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                    {isOverdue && <span className="font-semibold">!</span>}
                  </Chip>
                )}
                <Chip>
                  <div className={cn("w-1.5 h-1.5 rounded-full", pri.dot)} />
                  {pri.label}
                </Chip>
                {task.tags?.map((tag) => (
                  <Chip key={tag}>{tag.trim()}</Chip>
                ))}
                {task.related_product_name && (
                  <Chip><Link2 size={10} />{task.related_product_name}</Chip>
                )}
                {task.related_warehouse_name && (
                  <Chip><Warehouse size={10} />{task.related_warehouse_name}</Chip>
                )}
              </div>

              {/* Add menu */}
              {canManage && (
                <div className="flex items-center gap-1 py-2 border-b border-border">
                  <AddMenuButton icon={<User size={13} />} label="Miembros" active={openPopover === "members"} onClick={() => setOpenPopover(openPopover === "members" ? null : "members")} />
                  <AddMenuButton icon={<Tag size={13} />} label="Etiquetas" active={openPopover === "tags"} onClick={() => setOpenPopover(openPopover === "tags" ? null : "tags")} />
                  <AddMenuButton icon={<Calendar size={13} />} label="Fecha" active={openPopover === "date"} onClick={() => setOpenPopover(openPopover === "date" ? null : "date")} />
                  <AddMenuButton icon={<CheckSquare size={13} />} label="Checklist" onClick={() => {
                    if (!hasChecklist) {
                      onUpdate({ checklist: [{ id: crypto.randomUUID(), text: "", completed: false, created_at: new Date().toISOString() }] });
                    }
                    setOpenPopover(null);
                  }} />
                  <AddMenuButton icon={<Flag size={13} />} label="Prioridad" active={openPopover === "priority"} onClick={() => setOpenPopover(openPopover === "priority" ? null : "priority")} />
                  <AddMenuButton icon={<Warehouse size={13} />} label="Almacen" active={openPopover === "warehouse"} onClick={() => setOpenPopover(openPopover === "warehouse" ? null : "warehouse")} />
                </div>
              )}

              {/* Popovers */}
              {openPopover && canManage && (
                <div className="relative">
                  <div className="absolute top-0 left-0 z-20 mt-1">
                    {openPopover === "members" && (
                      <PopoverMenu
                        onClose={() => setOpenPopover(null)}
                        items={[
                          { label: "Sin asignar", onClick: () => { onUpdate({ assigned_to: null, assigned_to_name: null }); setOpenPopover(null); } },
                          ...users.map((u) => ({
                            icon: <div className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[9px] font-bold">{getInitials(u.full_name || u.email)}</div>,
                            label: u.full_name || u.email,
                            onClick: () => { onUpdate({ assigned_to: u.id, assigned_to_name: u.full_name || u.email }); setOpenPopover(null); },
                          })),
                        ]}
                      />
                    )}
                    {openPopover === "priority" && (
                      <PopoverMenu
                        onClose={() => setOpenPopover(null)}
                        items={[
                          { icon: <div className="w-2 h-2 rounded-full bg-red-500" />, label: "Urgente", onClick: () => { onUpdate({ priority: "urgente" as TaskPriority }); setOpenPopover(null); } },
                          { icon: <div className="w-2 h-2 rounded-full bg-orange-500" />, label: "Alta", onClick: () => { onUpdate({ priority: "alta" as TaskPriority }); setOpenPopover(null); } },
                          { icon: <div className="w-2 h-2 rounded-full bg-sky-500" />, label: "Media", onClick: () => { onUpdate({ priority: "media" as TaskPriority }); setOpenPopover(null); } },
                          { icon: <div className="w-2 h-2 rounded-full bg-slate-400" />, label: "Baja", onClick: () => { onUpdate({ priority: "baja" as TaskPriority }); setOpenPopover(null); } },
                        ]}
                      />
                    )}
                    {openPopover === "date" && (
                      <DatePopover
                        value={task.due_date}
                        onChange={(v) => { onUpdate({ due_date: v }); setOpenPopover(null); }}
                        onClose={() => setOpenPopover(null)}
                      />
                    )}
                    {openPopover === "tags" && (
                      <TagPopover
                        tags={task.tags || []}
                        onSave={(tags) => { onUpdate({ tags }); setOpenPopover(null); }}
                        onClose={() => setOpenPopover(null)}
                      />
                    )}
                    {openPopover === "warehouse" && warehouses && (
                      <PopoverMenu
                        onClose={() => setOpenPopover(null)}
                        items={[
                          { label: "Sin almacen", icon: <Warehouse size={13} className="text-muted-foreground" />, onClick: () => { onUpdate({ related_warehouse_id: null, related_warehouse_name: null }); setOpenPopover(null); } },
                          ...warehouses.map((w) => ({
                            icon: <Warehouse size={13} className="text-muted-foreground" />,
                            label: w.name,
                            onClick: () => { onUpdate({ related_warehouse_id: w.id, related_warehouse_name: w.name }); setOpenPopover(null); },
                          })),
                        ]}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Scrollable content */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-5">
              <section>
                <SectionHeader icon={<FileText size={14} />} title="Descripcion" />
                {editingDesc && canManage ? (
                  <div>
                    <textarea
                      ref={descRef}
                      value={descValue}
                      onChange={(e) => setDescValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Escape") { setDescValue(task.description || ""); setEditingDesc(false); } }}
                      rows={6}
                      className="w-full text-sm bg-muted/30 border border-border rounded-lg px-3 py-2 outline-none focus:border-primary resize-y"
                      placeholder="Añade una descripcion..."
                    />
                    <div className="flex gap-2 mt-1.5">
                      <Button size="sm" className="h-7 text-xs" onClick={saveDesc}>Guardar</Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setDescValue(task.description || ""); setEditingDesc(false); }}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => canManage && setEditingDesc(true)}
                    className={cn(
                      "text-sm rounded-lg px-3 py-2 whitespace-pre-wrap min-h-[80px]",
                      task.description ? "text-foreground/80" : "text-muted-foreground/50 italic bg-muted/30",
                      canManage && "cursor-pointer hover:bg-muted/50 transition-colors"
                    )}
                  >
                    {task.description || "Añadir una descripcion mas detallada..."}
                  </div>
                )}
              </section>

              {hasChecklist && (
                <section>
                  <TaskChecklist items={task.checklist || []} onChange={(items) => onUpdate({ checklist: items })} readOnly={!canManage} />
                </section>
              )}

              <section>
                <TaskAttachments taskId={task.id} />
              </section>

            </div>
          </div>

          {/* RIGHT: Comments sidebar */}
          <div className="w-80 shrink-0 border-l border-border flex flex-col min-h-0 bg-muted/5 overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
              <TaskComments taskId={task.id} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ---- Chip ----
function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-1 bg-muted/60 rounded px-2 py-0.5 text-[11px] text-foreground", className)}>
      {children}
    </div>
  );
}

// ---- Section Header ----
function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
      {icon} {title}
    </h4>
  );
}

// ---- Add Menu Button ----
function AddMenuButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer",
        active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// ---- Popover Menu ----
function PopoverMenu({
  items,
  onClose,
}: {
  items: { icon?: React.ReactNode; label: string; onClick: () => void; variant?: "destructive" }[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref} className="bg-card border border-border rounded-lg shadow-xl py-1 min-w-[180px] max-h-64 overflow-y-auto z-50">
      {items.map((item, i) => (
        <button
          key={i}
          onClick={item.onClick}
          className={cn(
            "w-full text-left flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors cursor-pointer",
            item.variant === "destructive" && "text-destructive hover:bg-destructive/10"
          )}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ---- Date Popover ----
function DatePopover({ value, onChange, onClose }: { value: string | null; onChange: (v: string | null) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref} className="bg-card border border-border rounded-lg shadow-xl p-3 min-w-[200px] space-y-2">
      <p className="text-xs font-medium text-foreground">Fecha limite</p>
      <input
        type="date"
        value={value || ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full text-xs bg-transparent border border-border rounded-md px-2.5 py-1.5 outline-none focus:border-primary"
      />
      {value && (
        <button onClick={() => onChange(null)} className="text-[11px] text-destructive hover:underline cursor-pointer">
          Quitar fecha
        </button>
      )}
    </div>
  );
}

// ---- Tag Popover ----
function TagPopover({ tags, onSave, onClose }: { tags: string[]; onSave: (tags: string[]) => void; onClose: () => void }) {
  const [value, setValue] = useState(tags.join(", "));
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const handleSave = () => {
    const parsed = value.split(",").map((t) => t.trim()).filter(Boolean);
    onSave(parsed.length > 0 ? parsed : []);
  };

  return (
    <div ref={ref} className="bg-card border border-border rounded-lg shadow-xl p-3 min-w-[220px] space-y-2">
      <p className="text-xs font-medium text-foreground">Etiquetas</p>
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
        placeholder="urgente, revision, compras..."
        className="w-full text-xs bg-transparent border border-border rounded-md px-2.5 py-1.5 outline-none focus:border-primary"
      />
      <Button size="sm" className="w-full h-7 text-[11px]" onClick={handleSave}>Guardar</Button>
    </div>
  );
}
