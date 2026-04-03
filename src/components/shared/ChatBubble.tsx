"use client";

import { useRef, useEffect, useState } from "react";
import { useChat } from "@dypai-ai/client-sdk/react";
import { useAuth } from "@/hooks/useAuth";
import { Bot, X, Send, Loader2, Sparkles, Trash2, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Markdown from "react-markdown";

type ViewMode = "bubble" | "expanded";


export function ChatBubble() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("bubble");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    input,
    setInput,
    sendMessage,
    isLoading,
    status,
    setMessages,
  } = useChat("stockpro_assistant");

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Close expanded with Escape
  useEffect(() => {
    if (viewMode !== "expanded") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewMode("bubble");
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [viewMode]);

  if (!user) return null;

  const handleSend = (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isLoading) return;
    sendMessage(msg);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => setMessages([]);

  const isExpanded = viewMode === "expanded";

  // --- Chat content (shared between both modes) ---
  const chatHeader = (
    <div className={cn(
      "flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 shrink-0",
      !isExpanded && "rounded-t-2xl"
    )}>
      <div className="flex items-center gap-2.5">
        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles size={16} className="text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Asistente StockPro</p>
          <p className="text-[10px] text-muted-foreground">
            {status === "streaming" ? "Escribiendo..." : "Tareas, stock, incidencias y mas"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Limpiar chat"
          >
            <Trash2 size={14} />
          </button>
        )}
        <button
          onClick={() => setViewMode(isExpanded ? "bubble" : "expanded")}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title={isExpanded ? "Minimizar" : "Expandir"}
        >
          {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
        <button
          onClick={() => { setOpen(false); setViewMode("bubble"); }}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );

  const chatMessages = (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-3">
          <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot size={24} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Hola, soy tu asistente</p>
            <p className="text-xs text-muted-foreground mt-1">
              Puedo gestionar tareas, incidencias, stock y mucho mas
            </p>
          </div>
          <div className={cn(
            "flex gap-2 w-full",
            isExpanded ? "flex-row flex-wrap justify-center" : "flex-col"
          )}>
            {[
              "Muestrame mis tareas pendientes",
              "Crea una incidencia de mercancia dañada",
              "Que productos tienen stock bajo?",
              "Registra salida de 10 unidades de Calcio 4pcs",
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSend(suggestion)}
                className={cn(
                  "text-xs text-left px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground",
                  isExpanded && "flex-1 min-w-[200px] text-center"
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.filter((m) => (m.role === "user" || m.role === "assistant") && m.content).map((msg) => (
        <div
          key={msg.id}
          className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
        >
          <div
            className={cn(
              "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
              isExpanded ? "max-w-[70%]" : "max-w-[85%]",
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-muted text-foreground rounded-bl-md"
            )}
          >
            <MessageContent content={msg.content} isUser={msg.role === "user"} />
          </div>
        </div>
      ))}

      {isLoading && status !== "streaming" && (
        <div className="flex justify-start">
          <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
            <div className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Pensando...</span>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );

  const chatInput = (
    <div className="p-3 border-t border-border shrink-0">
      <div className="flex items-center gap-2 bg-background rounded-xl border border-border px-3 py-1.5 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 text-foreground"
          disabled={isLoading}
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
          className={cn(
            "p-1.5 rounded-lg transition-all cursor-pointer",
            input.trim() && !isLoading
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "text-muted-foreground/40"
          )}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Floating button */}
      {!isExpanded && (
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "fixed bottom-6 right-6 z-50 size-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 cursor-pointer",
            open
              ? "bg-muted text-muted-foreground hover:bg-muted/80 scale-90"
              : "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105"
          )}
        >
          {open ? <X size={22} /> : <Bot size={24} />}
        </button>
      )}

      {/* Bubble mode */}
      {!isExpanded && (
        <div
          className={cn(
            "fixed bottom-24 right-6 z-50 w-[400px] max-w-[calc(100vw-48px)] rounded-2xl border border-border bg-card shadow-2xl flex flex-col transition-all duration-300 origin-bottom-right",
            open
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 translate-y-4 pointer-events-none"
          )}
          style={{ height: "min(600px, calc(100vh - 160px))" }}
        >
          {chatHeader}
          {chatMessages}
          {chatInput}
        </div>
      )}

      {/* Expanded mode (modal) */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewMode("bubble")} />
          <div className="relative w-full max-w-3xl h-[85vh] bg-card rounded-2xl border border-border shadow-2xl flex flex-col animate-in fade-in-0 zoom-in-95">
            {chatHeader}
            {chatMessages}
            {chatInput}
          </div>
        </div>
      )}
    </>
  );
}

function MessageContent({ content, isUser }: { content: string; isUser?: boolean }) {
  return (
    <Markdown
      components={{
        p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        ul: ({ children }) => <ul className="list-disc ml-4 mb-1.5 space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal ml-4 mb-1.5 space-y-0.5">{children}</ol>,
        li: ({ children }) => <li>{children}</li>,
        h1: ({ children }) => <p className="font-bold text-base mb-1">{children}</p>,
        h2: ({ children }) => <p className="font-bold text-sm mb-1">{children}</p>,
        h3: ({ children }) => <p className="font-semibold text-sm mb-1">{children}</p>,
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <pre className={cn(
                "rounded-lg px-3 py-2 my-1.5 text-xs font-mono overflow-x-auto",
                isUser ? "bg-primary-foreground/10" : "bg-background"
              )}>
                <code>{children}</code>
              </pre>
            );
          }
          return (
            <code className={cn(
              "rounded px-1 py-0.5 text-xs font-mono",
              isUser ? "bg-primary-foreground/15" : "bg-background"
            )}>
              {children}
            </code>
          );
        },
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:opacity-80">
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className={cn(
            "border-l-2 pl-3 my-1.5 italic",
            isUser ? "border-primary-foreground/30" : "border-border"
          )}>
            {children}
          </blockquote>
        ),
        hr: () => <hr className="my-2 border-border/50" />,
        table: ({ children }) => (
          <div className="overflow-x-auto my-1.5">
            <table className="text-xs w-full border-collapse">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className={cn(isUser ? "border-primary-foreground/20" : "border-border")}>{children}</thead>,
        th: ({ children }) => <th className="text-left px-2 py-1 border-b font-semibold">{children}</th>,
        td: ({ children }) => <td className="px-2 py-1 border-b border-border/30">{children}</td>,
      }}
    >
      {content}
    </Markdown>
  );
}
