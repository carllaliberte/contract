import { useCallback, useEffect, useState } from "react";
import {
  clearSession,
  establishDemoSession,
  resolveSessionKind,
  type SessionKind,
} from "../lib/auth/session";

export function useAuth() {
  const [session, setSession] = useState<SessionKind | "loading">("loading");

  const refresh = useCallback(async () => {
    const kind = await resolveSessionKind();
    setSession(kind);
    return kind;
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const enterDemo = useCallback(async () => {
    await establishDemoSession();
    setSession("demo");
  }, []);

  const signOut = useCallback(async () => {
    await clearSession();
    setSession("none");
  }, []);

  return {
    session,
    isAppAllowed: session === "demo" || session === "apple",
    isAuthenticated: session === "apple",
    isDemo: session === "demo",
    isLoading: session === "loading",
    enterDemo,
    signOut,
    refresh,
  };
}
