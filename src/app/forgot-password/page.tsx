"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, ArrowLeft, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/FormInput";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError("");
    setLoading(true);

    const { error } = await resetPassword(email);
    if (error) {
      setError(error);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)] p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--accent)] rounded-2xl mb-4">
            <Package size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">StockPro</h1>
        </div>

        <div className="bg-[var(--bg-card)] rounded-[var(--radius)] shadow-[var(--shadow-lg)] border border-[var(--border-primary)] p-6">
          {sent ? (
            /* Success state */
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[var(--success-light)] rounded-full">
                <Mail size={24} className="text-[var(--success)]" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Email enviado
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                Hemos enviado un enlace a <strong className="text-[var(--text-primary)]">{email}</strong> para restablecer tu contrasena. Revisa tu bandeja de entrada.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline font-medium"
              >
                <ArrowLeft size={16} />
                Volver al login
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                Recuperar contrasena
              </h2>
              <p className="text-sm text-[var(--text-muted)] mb-6">
                Introduce tu email y te enviaremos un enlace para restablecer tu contrasena.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <FormInput
                  label="Email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                {error && (
                  <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--danger-light)] text-[var(--danger)] text-sm">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar enlace"}
                </Button>
              </form>

              <div className="mt-6 pt-4 border-t border-[var(--border-primary)] text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline font-medium"
                >
                  <ArrowLeft size={16} />
                  Volver al login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
