import type { Metadata } from "next";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { Toaster } from "sileo";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "StockPro - Gestion de Stock",
  description: "Sistema de gestion de stock multi-almacen",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className="antialiased">
        {/* Splash screen - renders instantly with inline styles before CSS/JS loads */}
        <div
          id="initial-loader"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--background, #f9fafb)",
            transition: "opacity 300ms ease-out",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
            {/* Logo icon */}
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "rgb(99,102,241)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: "initial-pulse 1.5s ease-in-out infinite",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16.5 9.4 7.55 4.24" />
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.29 7 12 12 20.71 7" />
                <line x1="12" y1="22" x2="12" y2="12" />
              </svg>
            </div>
            {/* Loading bar */}
            <div
              style={{
                width: 120,
                height: 3,
                borderRadius: 3,
                backgroundColor: "rgba(99,102,241,0.15)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: "40%",
                  height: "100%",
                  borderRadius: 3,
                  backgroundColor: "rgb(99,102,241)",
                  animation: "initial-slide 1s ease-in-out infinite",
                }}
              />
            </div>
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes initial-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.85;transform:scale(.97)}}
          @keyframes initial-slide{0%{transform:translateX(-100%)}100%{transform:translateX(350%)}}
        ` }} />
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
