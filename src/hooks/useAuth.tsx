"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { dypai } from "@/lib/dypai";
import type { AppUser } from "@/lib/types";

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function toAppUser(u: any): AppUser | null {
  if (!u?.id) return null;
  return {
    id: u.id,
    email: u.email,
    full_name: u.full_name ?? u.user_metadata?.full_name,
    role: u.role, // SDK normalizes app_metadata.role -> user.role
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function init() {
      try {
        const { data } = await dypai.auth.getUser();
        setUser(toAppUser(data));
      } catch {
        // no session
      } finally {
        setLoading(false);
        const el = document.getElementById("initial-loader");
        if (el) {
          el.style.opacity = "0";
          el.style.transition = "opacity 200ms ease-out";
          setTimeout(() => el.remove(), 200);
        }
      }
    }
    init();

    const { data: listener } = dypai.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        router.push("/reset-password");
        return;
      }

      if (session?.user) {
        setUser(toAppUser(session.user));
      } else {
        setUser(null);
      }
    });

    return () => {
      listener?.subscription?.unsubscribe?.();
    };
  }, [router]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await dypai.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message || "Error al iniciar sesion" };
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await dypai.auth.signOut();
    setUser(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await dypai.auth.resetPasswordForEmail(email);
    if (error) return { error: error.message || "Error al enviar email" };
    return { error: null };
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await dypai.auth.updateUser({ password: newPassword });
    if (error) return { error: error.message || "Error al cambiar contrasena" };
    return { error: null };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
