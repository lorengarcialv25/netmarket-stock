"use client";

import { useState, useEffect, useCallback } from "react";
import { dypai } from "@/lib/dypai";
import {
  Activity,
  ArrowRight,
  UserPlus,
  UserMinus,
  MessageSquare,
  Paperclip,
  CheckSquare,
  Clock,
} from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import type { TaskActivity } from "@/lib/types";

interface TaskActivityLogProps {
  taskId: string;
}

const actionConfig: Record<string, { icon: typeof Activity; label: (d: Record<string, unknown>) => string }> = {
  status_changed: {
    icon: ArrowRight,
    label: (d) => `cambio estado de "${d.from || "?"}" a "${d.to || "?"}"`,
  },
  priority_changed: {
    icon: Clock,
    label: (d) => `cambio prioridad de "${d.from || "?"}" a "${d.to || "?"}"`,
  },
  assigned: {
    icon: UserPlus,
    label: (d) => `asigno la tarea a ${d.assigned_to_name || "un usuario"}`,
  },
  unassigned: {
    icon: UserMinus,
    label: () => "quito la asignacion de la tarea",
  },
  comment_added: {
    icon: MessageSquare,
    label: () => "añadio un comentario",
  },
  attachment_added: {
    icon: Paperclip,
    label: (d) => `adjunto "${d.file_name || "un archivo"}"`,
  },
  checklist_updated: {
    icon: CheckSquare,
    label: () => "actualizo la checklist",
  },
  created: {
    icon: Activity,
    label: () => "creo la tarea",
  },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days}d`;
  return new Date(dateStr).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

export function TaskActivityLog({ taskId }: TaskActivityLogProps) {
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const fetchActivity = useCallback(async () => {
    const { data, error } = await dypai.api.get("list_task_activity", {
      params: { task_id: taskId },
    });
    if (!error && data) {
      setActivities(data as TaskActivity[]);
    }
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const displayed = expanded ? activities : activities.slice(0, 5);

  return (
    <div className="space-y-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 cursor-pointer group"
      >
        <Activity size={16} className="text-muted-foreground" />
        <h4 className="text-sm font-medium text-foreground">Actividad</h4>
        <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">
          {expanded ? "Ocultar" : "Mostrar"}
        </span>
      </button>

      {expanded && (
        <>
          {loading ? (
            <Spinner size="sm" />
          ) : activities.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">Sin actividad</p>
          ) : (
            <div className="space-y-0">
              {displayed.map((act) => {
                const cfg = actionConfig[act.action] || {
                  icon: Activity,
                  label: () => act.action,
                };
                const Icon = cfg.icon;
                return (
                  <div key={act.id} className="flex items-start gap-3 py-2 relative">
                    {/* Timeline line */}
                    <div className="absolute left-[11px] top-8 bottom-0 w-px bg-border" />
                    {/* Icon */}
                    <div className="shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center z-10">
                      <Icon size={12} className="text-muted-foreground" />
                    </div>
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground/80">
                        <span className="font-medium">{act.user_name || "Sistema"}</span>{" "}
                        {cfg.label(act.details)}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {timeAgo(act.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              {!expanded && activities.length > 5 && (
                <button
                  onClick={() => setExpanded(true)}
                  className="text-xs text-primary hover:underline cursor-pointer pl-9"
                >
                  Ver {activities.length - 5} mas...
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
