"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";
import { WarehouseProvider } from "@/hooks/useWarehouse";
import { Spinner } from "@/components/ui/Spinner";
import { Eye } from "lucide-react";

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
          {user.role === "viewer" && (
            <div className="shrink-0 flex items-center gap-2 px-4 py-1.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-medium">
              <Eye size={12} />
              Modo solo lectura — contacta con un administrador para obtener permisos de edicion
            </div>
          )}
          <main className="flex-1 p-4 lg:p-6 overflow-y-auto bg-background">
            {children}
          </main>
        </div>
      </div>
    </WarehouseProvider>
  );
}
