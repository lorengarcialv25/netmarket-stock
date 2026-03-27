"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/FormInput";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { updatePassword } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("La contrasena debe tener al menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contrasenas no coinciden");
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(password);
    if (error) {
      setError(error);
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/"), 2000);
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
          {success ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[var(--success-light)] rounded-full">
                <CheckCircle size={24} className="text-[var(--success)]" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Contrasena actualizada
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                Tu contrasena se ha cambiado correctamente. Redirigiendo...
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                Nueva contrasena
              </h2>
              <p className="text-sm text-[var(--text-muted)] mb-6">
                Introduce tu nueva contrasena.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <FormInput
                    label="Nueva contrasena"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[34px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <FormInput
                  label="Confirmar contrasena"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repite la contrasena"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                {error && (
                  <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--danger-light)] text-[var(--danger)] text-sm">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Cambiando..." : "Cambiar contrasena"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
