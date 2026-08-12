"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type LogoutButtonProps = {
  className?: string;
  /** Renders as a full-width outlined card-style button when true */
  fullWidth?: boolean;
};

export function LogoutButton({ className, fullWidth }: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        setError("Não foi possível encerrar a sessão. Tente novamente.");
        setLoading(false);
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setError("Erro inesperado ao sair. Tente novamente.");
      setLoading(false);
    }
  }

  if (fullWidth) {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleLogout}
          disabled={loading}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-[var(--at-radius-md)] border border-destructive px-4 py-2.5 text-sm font-medium text-destructive",
            "hover:bg-destructive/5 transition-colors duration-150",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            className
          )}
          aria-label="Encerrar sessão"
        >
          <LogOut size={16} aria-hidden="true" />
          {loading ? "Saindo..." : "Sair da conta"}
        </button>
        {error && (
          <p role="alert" className="text-xs text-destructive text-center">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className={cn(
          "flex items-center gap-2 rounded-[var(--at-radius-md)] px-3 py-2 text-xs font-medium",
          "text-[var(--at-navy-muted)] hover:bg-white/10 hover:text-white transition-colors duration-150",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        aria-label="Encerrar sessão"
      >
        <LogOut size={14} aria-hidden="true" />
        {loading ? "Saindo..." : "Sair"}
      </button>
      {error && (
        <p role="alert" className="text-xs text-red-400 px-3">
          {error}
        </p>
      )}
    </div>
  );
}
