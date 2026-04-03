"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { dypai } from "@/lib/dypai";
import { useAuth } from "@/hooks/useAuth";
import { sileo } from "sileo";
import { LayoutGrid, List, Plus, Trash2, GripVertical, Settings, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus, TaskStatusColumn, AppUser } from "@/lib/types";
import { FormInput } from "@/components/ui/FormInput";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TaskTable } from "./_components/TaskTable";
import { TaskForm, type TaskFormData } from "./_components/TaskForm";
import { KanbanBoard } from "./_components/KanbanBoard";
import { TaskDetailPanel } from "./_components/TaskDetailPanel";
import { Spinner } from "@/components/ui/Spinner";

const emptyForm: TaskFormData = {
  title: "",
  description: "",
  status: "pendiente",
  priority: "media",
  task_type: "manual",
  due_date: "",
  assigned_to: "",
  tags: "",
  related_product_id: "",
  related_warehouse_id: "",
};

function buildTaskPayload(task: Task): Record<string, unknown> {
  return {
    id: task.id,
    title: task.title,
    description: task.description || "",
    status: task.status,
    priority: task.priority,
    task_type: task.task_type || "manual",
    due_date: task.due_date || "",
    assigned_to: task.assigned_to || "",
    related_product_id: task.related_product_id || "",
    related_warehouse_id: task.related_warehouse_id || "",
    checklist: JSON.stringify(task.checklist || []),
    tags: task.tags?.join(", ") || "",
  };
}

const COLUMN_COLORS = [
  "#eab308", "#3b82f6", "#22c55e", "#6b7280", "#ef4444",
  "#8b5cf6", "#f97316", "#06b6d4", "#ec4899", "#14b8a6",
];

type ViewMode = "kanban" | "table";

export default function TareasPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [columns, setColumns] = useState<TaskStatusColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TaskFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [columnsModalOpen, setColumnsModalOpen] = useState(false);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);

  const isWorker = user?.role === "worker";
  const canManage = user?.role === "admin" || user?.role === "colaborador" || user?.role === "warehouse_manager" || isWorker;
  const isAdmin = user?.role === "admin";

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await dypai.api.get("list_tasks");
    if (!error && data) {
      setTasks(data as Task[]);
    }
    setLoading(false);
  }, []);

  const fetchColumns = useCallback(async () => {
    const { data, error } = await dypai.api.get("list_task_statuses");
    if (!error && data) {
      setColumns(data as TaskStatusColumn[]);
    }
  }, []);

  const fetchWarehouses = useCallback(async () => {
    const { data, error } = await dypai.api.get("list_warehouses");
    if (!error && data) {
      setWarehouses((data as { id: string; name: string }[]).map((w) => ({ id: w.id, name: w.name })));
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await dypai.users.list();
      const rows: Record<string, unknown>[] = Array.isArray(data)
        ? (data as Record<string, unknown>[])
        : Array.isArray((data as { users?: unknown[] } | null)?.users)
          ? ((data as { users: unknown[] }).users as Record<string, unknown>[])
          : [];
      if (rows.length > 0) {
        setUsers(
          rows.map((u: Record<string, unknown>) => ({
            id: u.id as string,
            email: u.email as string,
            full_name: ((u.user_metadata as Record<string, unknown>)?.full_name as string) || (u.email as string),
          }))
        );
      }
    } catch {
      // Users list only available for admins
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchColumns();
    fetchUsers();
    fetchWarehouses();
  }, [fetchTasks, fetchColumns, fetchUsers, fetchWarehouses]);

  const terminalStatusNames = columns.filter((c) => c.is_terminal).map((c) => c.name);

  const filtered = tasks.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.assigned_to_name || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || t.status === statusFilter;
    const matchPriority = !priorityFilter || t.priority === priorityFilter;
    const matchCompleted = showCompleted || !terminalStatusNames.includes(t.status);
    return matchSearch && matchStatus && matchPriority && matchCompleted;
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openDetail = (task: Task) => {
    setSelectedTask(task);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    setSubmitting(true);

    const payload: Record<string, string> = {
      title: form.title,
      description: form.description,
      status: form.status,
      priority: form.priority,
      task_type: form.task_type,
      due_date: form.due_date,
      assigned_to: isWorker ? (user?.id || "") : form.assigned_to,
      tags: form.tags,
      related_product_id: form.related_product_id,
      related_warehouse_id: form.related_warehouse_id,
    };

    if (editingId) {
      const { error } = await dypai.api.put("update_task", { ...payload, id: editingId });
      if (error) {
        setSubmitting(false);
        sileo.error({ title: "Error al actualizar tarea" });
        return;
      }
      sileo.success({ title: "Tarea actualizada" });
    } else {
      const { error } = await dypai.api.post("create_task", payload);
      if (error) {
        setSubmitting(false);
        sileo.error({ title: "Error al crear tarea" });
        return;
      }
      sileo.success({ title: "Tarea creada" });
    }

    setModalOpen(false);
    setSubmitting(false);
    fetchTasks();
  };

  const handleQuickAdd = async (title: string, status: string) => {
    const { error } = await dypai.api.post("create_task", {
      title,
      status,
      priority: "media",
      task_type: "manual",
      description: "",
      due_date: "",
      assigned_to: isWorker ? (user?.id || "") : "",
      tags: "",
      related_product_id: "",
      related_warehouse_id: "",
    });
    if (error) {
      sileo.error({ title: "Error al crear tarea" });
    } else {
      fetchTasks();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await dypai.api.delete("delete_task", { params: { id } });
    setConfirmDeleteId(null);
    if (error) {
      sileo.error({ title: "Error al eliminar tarea" });
      return;
    }
    sileo.success({ title: "Tarea eliminada" });
    if (selectedTask?.id === id) setSelectedTask(null);
    fetchTasks();
  };

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );
    if (selectedTask?.id === task.id) {
      setSelectedTask((prev) => prev ? { ...prev, status: newStatus } : null);
    }
    const { error } = await dypai.api.put("update_task", buildTaskPayload({ ...task, status: newStatus }));
    if (error) {
      sileo.error({ title: "Error al cambiar estado" });
      fetchTasks();
    }
  };

  const handleInlineUpdate = async (task: Task, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, ...updates } : t))
    );
    if (selectedTask?.id === task.id) {
      setSelectedTask((prev) => prev ? { ...prev, ...updates } : null);
    }
    const { error } = await dypai.api.put("update_task", buildTaskPayload({ ...task, ...updates }));
    if (error) {
      sileo.error({ title: "Error al actualizar" });
      fetchTasks();
    }
  };

  const handleDetailUpdate = async (updates: Partial<Task>) => {
    if (!selectedTask) return;
    const updated = { ...selectedTask, ...updates };
    setSelectedTask(updated);
    setTasks((prev) =>
      prev.map((t) => (t.id === selectedTask.id ? { ...t, ...updates } : t))
    );
    const { error } = await dypai.api.put("update_task", buildTaskPayload({ ...selectedTask, ...updates }));
    if (error) {
      sileo.error({ title: "Error al actualizar" });
      fetchTasks();
    }
  };

  const handleDetailDelete = () => {
    if (selectedTask) {
      setConfirmDeleteId(selectedTask.id);
    }
  };

  // Dynamic summary from columns
  const nonTerminalColumns = columns.filter((c) => !c.is_terminal);
  const terminalColumns = columns.filter((c) => c.is_terminal);

  // Status options for filter
  const statusOptions = [
    { value: "", label: "Todos" },
    ...columns.map((c) => ({ value: c.name, label: c.label })),
  ];

  const completedCount = tasks.filter((t) => terminalStatusNames.includes(t.status)).length;
  const activeCount = tasks.length - completedCount;

  return (
    <div className="space-y-0">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tareas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeCount} activa{activeCount !== 1 ? "s" : ""}
            {completedCount > 0 && !showCompleted && (
              <span> · {completedCount} finalizada{completedCount !== 1 ? "s" : ""}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <Button size="sm" className="gap-1.5" onClick={openCreate}>
              <Plus size={14} />
              Nueva Tarea
            </Button>
          )}
        </div>
      </div>

      {/* Toolbar: tabs + filters */}
      <div className="rounded-xl border border-border bg-card mb-4">
        {/* Top row: view tabs + search */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          {/* Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode("kanban")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer",
                viewMode === "kanban"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <LayoutGrid size={14} />
              Kanban
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer",
                viewMode === "table"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <List size={14} />
              Tabla
            </button>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="h-8 w-72 rounded-md border border-border bg-transparent px-3 text-xs outline-none focus:border-primary placeholder:text-muted-foreground/50"
            />
          </div>
        </div>

        {/* Bottom row: filters */}
        <div className="flex items-center gap-2 px-4 py-2 flex-wrap">
          {viewMode === "table" && (
            <FilterChipSelect
              label="Estado"
              value={statusFilter}
              options={statusOptions}
              onChange={setStatusFilter}
            />
          )}
          <FilterChipSelect
            label="Prioridad"
            value={priorityFilter}
            options={[
              { value: "", label: "Todas" },
              { value: "urgente", label: "Urgente" },
              { value: "alta", label: "Alta" },
              { value: "media", label: "Media" },
              { value: "baja", label: "Baja" },
            ]}
            onChange={setPriorityFilter}
          />
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border cursor-pointer whitespace-nowrap",
              showCompleted
                ? "bg-primary/10 text-primary border-primary/30"
                : "text-muted-foreground border-transparent hover:bg-muted"
            )}
          >
            {showCompleted ? "Ocultar finalizadas" : "Mostrar finalizadas"}
            {!showCompleted && completedCount > 0 && (
              <span className="text-[10px] bg-muted/80 rounded-full px-1.5 font-normal">{completedCount}</span>
            )}
          </button>

          <div className="ml-auto" />

          {isAdmin && viewMode === "kanban" && (
            <button
              onClick={() => setColumnsModalOpen(true)}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Settings size={12} />
              Columnas
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-12">
          <Spinner size="md" label="Cargando tareas..." />
        </div>
      ) : viewMode === "kanban" ? (
        <KanbanBoard
          tasks={filtered}
          columns={showCompleted ? columns : columns.filter((c) => !c.is_terminal)}
          onStatusChange={handleStatusChange}
          onOpen={openDetail}
          onDelete={(id) => setConfirmDeleteId(id)}
          onQuickAdd={handleQuickAdd}
          canManage={canManage}
        />
      ) : (
        <TaskTable
          tasks={filtered}
          columns={columns}
          loading={false}
          onOpen={openDetail}
          onDelete={(id) => setConfirmDeleteId(id)}
          onStatusChange={handleStatusChange}
          onPriorityChange={(task, priority) => handleInlineUpdate(task, { priority: priority as Task["priority"] })}
        />
      )}

      {/* Task Detail Panel */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          users={users}
          columns={columns}
          warehouses={warehouses}
          onUpdate={handleDetailUpdate}
          onDelete={handleDetailDelete}
          onClose={() => setSelectedTask(null)}
          canManage={canManage}
        />
      )}

      {/* Create Form Modal */}
      <TaskForm
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editingId={editingId}
        form={form}
        setForm={setForm}
        onSubmit={handleSubmit}
        submitting={submitting}
        users={users}
        isWorker={isWorker}
      />

      {/* Manage Columns Modal */}
      {columnsModalOpen && (
        <ColumnsManager
          columns={columns}
          onClose={() => setColumnsModalOpen(false)}
          onRefresh={fetchColumns}
        />
      )}

      <ConfirmDialog
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        title="Confirmar Eliminacion"
        message="Esta seguro de que desea eliminar esta tarea? Esta accion no se puede deshacer."
      />
    </div>
  );
}

// ---- Filter Chip Select ----

function FilterChipSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border cursor-pointer whitespace-nowrap",
          value
            ? "bg-primary/10 text-primary border-primary/30"
            : "text-muted-foreground border-transparent hover:bg-muted"
        )}
      >
        {value ? selected?.label : label}
        <ChevronDown size={10} className="opacity-50" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-30 bg-card border border-border rounded-lg shadow-xl py-1 min-w-[130px] max-h-52 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={cn(
                "w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors cursor-pointer",
                opt.value === value && "bg-muted/60 font-medium"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Columns Manager ----

function ColumnsManager({
  columns: initialColumns,
  onClose,
  onRefresh,
}: {
  columns: TaskStatusColumn[];
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [cols, setCols] = useState<TaskStatusColumn[]>(initialColumns);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState(COLUMN_COLORS[4]);
  const [newIsTerminal, setNewIsTerminal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const isProtected = (name: string) => ["pendiente", "completada"].includes(name);

  // --- Drag & drop reorder ---
  const handleDragStart = (idx: number) => {
    setDragIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    setDragOverIdx(idx);
  };

  const handleDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx) return;
    const updated = [...cols];
    const [moved] = updated.splice(dragIdx, 1);
    updated.splice(idx, 0, moved);
    setCols(updated);
    setDragIdx(null);
    setDragOverIdx(null);
    // Save new order
    saveOrder(updated);
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const saveOrder = async (ordered: TaskStatusColumn[]) => {
    setSaving(true);
    await Promise.all(
      ordered.map((col, i) =>
        dypai.api.put("update_task_status", { id: col.id, position: String(i) })
      )
    );
    onRefresh();
    setSaving(false);
  };

  // --- Move up/down ---
  const moveColumn = (idx: number, direction: -1 | 1) => {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= cols.length) return;
    const updated = [...cols];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    setCols(updated);
    saveOrder(updated);
  };

  // --- Inline edit label ---
  const startEditLabel = (col: TaskStatusColumn) => {
    setEditingId(col.id);
    setEditLabel(col.label);
  };

  const saveLabel = async (col: TaskStatusColumn) => {
    const val = editLabel.trim();
    setEditingId(null);
    if (!val || val === col.label) return;
    setCols((prev) => prev.map((c) => (c.id === col.id ? { ...c, label: val } : c)));
    await dypai.api.put("update_task_status", { id: col.id, label: val });
    onRefresh();
  };

  // --- Color change ---
  const handleColorChange = async (col: TaskStatusColumn, color: string) => {
    setCols((prev) => prev.map((c) => (c.id === col.id ? { ...c, color } : c)));
    await dypai.api.put("update_task_status", { id: col.id, color });
    onRefresh();
  };

  // --- Toggle terminal ---
  const handleToggleTerminal = async (col: TaskStatusColumn) => {
    const val = !col.is_terminal;
    setCols((prev) => prev.map((c) => (c.id === col.id ? { ...c, is_terminal: val } : c)));
    await dypai.api.put("update_task_status", { id: col.id, is_terminal: val ? "true" : "false" });
    onRefresh();
  };

  // --- Add ---
  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    setAdding(true);
    const { error } = await dypai.api.post("create_task_status", {
      label: newLabel.trim(),
      color: newColor,
      is_terminal: newIsTerminal ? "true" : "false",
    });
    if (error) {
      sileo.error({ title: "Error al crear columna" });
    } else {
      sileo.success({ title: "Columna creada" });
      setNewLabel("");
      setNewIsTerminal(false);
      const { data } = await dypai.api.get("list_task_statuses");
      if (data) setCols(data as TaskStatusColumn[]);
      onRefresh();
    }
    setAdding(false);
  };

  // --- Delete ---
  const handleDelete = async (col: TaskStatusColumn) => {
    if (isProtected(col.name)) return;
    const { error } = await dypai.api.delete("delete_task_status", { params: { id: col.id } });
    if (error) {
      sileo.error({ title: "Error al eliminar" });
    } else {
      sileo.success({ title: "Columna eliminada" });
      setCols((prev) => prev.filter((c) => c.id !== col.id));
      onRefresh();
    }
  };

  return (
    <Modal open onClose={onClose} title="Gestionar Columnas" size="lg">
      <div className="space-y-5">
        <p className="text-xs text-muted-foreground">
          Arrastra para reordenar. Haz clic en el nombre para editarlo. Las columnas marcadas como &quot;Final&quot; indican tareas completadas.
        </p>

        {/* Column list */}
        <div className="space-y-1">
          {cols.map((col, idx) => (
            <div
              key={col.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={handleDragEnd}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all",
                dragOverIdx === idx && dragIdx !== idx
                  ? "border-primary bg-primary/5 border-dashed"
                  : "border-border bg-card",
                dragIdx === idx && "opacity-50"
              )}
            >
              {/* Drag handle */}
              <div className="cursor-grab active:cursor-grabbing shrink-0">
                <GripVertical size={16} className="text-muted-foreground/50" />
              </div>

              {/* Position number */}
              <span className="text-[10px] text-muted-foreground font-mono w-4 text-center shrink-0">
                {idx + 1}
              </span>

              {/* Color dot + picker */}
              <label className="shrink-0 cursor-pointer relative">
                <div className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 shadow-sm" style={{ backgroundColor: col.color }} />
                <input
                  type="color"
                  value={col.color}
                  onChange={(e) => handleColorChange(col, e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </label>

              {/* Label (inline editable) */}
              {editingId === col.id ? (
                <input
                  autoFocus
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  onBlur={() => saveLabel(col)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveLabel(col); if (e.key === "Escape") setEditingId(null); }}
                  className="text-sm font-medium bg-transparent border-b border-primary outline-none flex-1 min-w-0 py-0.5"
                />
              ) : (
                <button
                  onClick={() => startEditLabel(col)}
                  className="text-sm font-medium text-foreground flex-1 text-left hover:text-primary transition-colors cursor-pointer truncate"
                >
                  {col.label}
                </button>
              )}

              {/* Terminal toggle */}
              <button
                onClick={() => !isProtected(col.name) && handleToggleTerminal(col)}
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors shrink-0",
                  col.is_terminal
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-muted text-muted-foreground",
                  !isProtected(col.name) && "cursor-pointer hover:opacity-80"
                )}
              >
                {col.is_terminal ? "Final" : "Activo"}
              </button>

              {/* Move up/down */}
              <div className="flex flex-col shrink-0">
                <button
                  onClick={() => moveColumn(idx, -1)}
                  disabled={idx === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer disabled:cursor-default p-0.5"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12"><path d="M6 3L10 8H2L6 3Z" fill="currentColor"/></svg>
                </button>
                <button
                  onClick={() => moveColumn(idx, 1)}
                  disabled={idx === cols.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer disabled:cursor-default p-0.5"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12"><path d="M6 9L2 4H10L6 9Z" fill="currentColor"/></svg>
                </button>
              </div>

              {/* Delete */}
              {!isProtected(col.name) ? (
                <button
                  onClick={() => handleDelete(col)}
                  className="p-1 rounded hover:bg-destructive/10 cursor-pointer shrink-0"
                >
                  <Trash2 size={14} className="text-destructive" />
                </button>
              ) : (
                <div className="w-7" />
              )}
            </div>
          ))}
        </div>

        {saving && (
          <p className="text-xs text-muted-foreground text-center">Guardando orden...</p>
        )}

        {/* Add new column */}
        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <Plus size={14} />
            Nueva columna
          </h4>
          <div className="space-y-3">
            <FormInput
              label="Nombre"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Ej: En Revision, Bloqueada, QA..."
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Color:</span>
                <div className="flex items-center gap-1.5">
                  {COLUMN_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewColor(c)}
                      className={cn(
                        "w-5 h-5 rounded-full cursor-pointer transition-all",
                        newColor === c ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-105"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={newIsTerminal}
                  onChange={(e) => setNewIsTerminal(e.target.checked)}
                  className="rounded"
                />
                Estado final
              </label>
            </div>
            <Button onClick={handleAdd} disabled={!newLabel.trim() || adding} className="w-full gap-1.5">
              <Plus size={14} />
              {adding ? "Creando..." : "Añadir columna"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
