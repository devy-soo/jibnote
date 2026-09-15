import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

export function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const initialized = useAuthStore((s) => s.initialized);

  if (!initialized) return null;
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
