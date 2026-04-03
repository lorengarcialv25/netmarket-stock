"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";
import { WarehouseProvider } from "@/hooks/useWarehouse";
import { DypaiProvider } from "@dypai-ai/client-sdk/react";
import { dypai } from "@/lib/dypai";
import { Spinner } from "@/components/ui/Spinner";
import { ChatBubble } from "@/components/shared/ChatBubble";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" label="Cargando..." />
      </div>
    );
  }

  if (!user) return null;

  return (
    <DypaiProvider client={dypai}>
    <WarehouseProvider>
      <div className="h-screen flex overflow-hidden bg-background">
        <Sidebar
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          collapsed={collapsed}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <Header
            onMobileMenuClick={() => setMobileOpen(true)}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(!collapsed)}
          />
          <main className="flex-1 p-4 lg:p-6 overflow-y-auto bg-background">
            {children}
          </main>
        </div>
        {(user.role === "admin" || user.role === "colaborador") && <ChatBubble />}
      </div>
    </WarehouseProvider>
    </DypaiProvider>
  );
}
