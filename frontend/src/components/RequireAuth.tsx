import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";

export function RequireAuth({ children }: { children: ReactElement }) {
  const auth = useAuth();
  const location = useLocation();

  if (auth.status === "loading") {
    return null;
  }

  if (auth.status !== "authenticated") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
