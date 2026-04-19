import { useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { useGameStore } from "../store/gameStore";

export function AuthGameSync() {
  const { session, user } = useAuth();
  const hydrateCloudState = useGameStore((state) => state.hydrateCloudState);
  const clearCloudState = useGameStore((state) => state.clearCloudState);

  useEffect(() => {
    if (session?.access_token && user?.id) {
      void hydrateCloudState(session.access_token, user.id);
      return;
    }

    clearCloudState();
  }, [clearCloudState, hydrateCloudState, session?.access_token, user?.id]);

  return null;
}
