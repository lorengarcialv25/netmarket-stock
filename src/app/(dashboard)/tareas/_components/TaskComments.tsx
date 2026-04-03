"use client";

import { useState, useEffect, useCallback } from "react";
import { dypai } from "@/lib/dypai";
import { useAuth } from "@/hooks/useAuth";
import { sileo } from "sileo";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner";
import type { TaskComment } from "@/lib/types";

interface TaskCommentsProps {
  taskId: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

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

export function TaskComments({ taskId }: TaskCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    const { data, error } = await dypai.api.get("list_task_comments", {
      params: { task_id: taskId },
    });
    if (!error && data) {
      setComments(data as TaskComment[]);
    }
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async () => {
    const content = newComment.trim();
    if (!content || submitting) return;
    setSubmitting(true);
    const { error } = await dypai.api.post("add_task_comment", {
      task_id: taskId,
      content,
    });
    if (error) {
      sileo.error({ title: "Error al añadir comentario" });
    } else {
      setNewComment("");
      fetchComments();
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await dypai.api.delete("delete_task_comment", { params: { id } });
    if (error) {
      sileo.error({ title: "Error al eliminar comentario" });
    } else {
      setComments((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare size={16} className="text-muted-foreground" />
        <h4 className="text-sm font-medium text-foreground">
          Comentarios {comments.length > 0 && `(${comments.length})`}
        </h4>
      </div>

      {loading ? (
        <Spinner size="sm" />
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="group flex gap-3">
              {/* Avatar */}
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                {getInitials(comment.user_name || "?")}
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {comment.user_name || "Usuario"}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {timeAgo(comment.created_at)}
                  </span>
                  {(isAdmin || comment.user_id === user?.id) && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10 cursor-pointer ml-auto"
                    >
                      <Trash2 size={12} className="text-destructive" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-foreground/80 mt-0.5 whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}

          {comments.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">Sin comentarios</p>
          )}
        </div>
      )}

      {/* New comment input */}
      <div className="flex items-end gap-2 pt-2 border-t border-border">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un comentario..."
          rows={2}
          className="flex-1 text-sm bg-muted/30 border border-border rounded-lg px-3 py-2 outline-none focus:border-primary resize-none placeholder:text-muted-foreground/60"
        />
        <Button
          variant="default"
          size="sm"
          className="h-9 w-9 p-0 shrink-0"
          onClick={handleSubmit}
          disabled={!newComment.trim() || submitting}
        >
          <Send size={14} />
        </Button>
      </div>
    </div>
  );
}
