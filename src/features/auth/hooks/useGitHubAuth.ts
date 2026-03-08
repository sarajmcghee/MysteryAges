import { useEffect, useMemo, useState } from "react";
import type { AuthUser } from "../types/auth";
import { fetchAuthSession, getAllowedGitHubLogin } from "../services/authService";

type AuthState = "loading" | "unauthenticated" | "unauthorized" | "authenticated" | "error";

interface UseGitHubAuthResult {
  state: AuthState;
  user: AuthUser | undefined;
  error: string | undefined;
  allowedLogin: string | undefined;
  refresh: () => Promise<void>;
}

export function useGitHubAuth(): UseGitHubAuthResult {
  const [state, setState] = useState<AuthState>("loading");
  const [user, setUser] = useState<AuthUser | undefined>();
  const [error, setError] = useState<string | undefined>();

  const allowedLogin = useMemo(() => {
    try {
      return getAllowedGitHubLogin();
    } catch {
      return undefined;
    }
  }, []);

  async function refresh() {
    setError(undefined);
    setState("loading");

    try {
      const session = await fetchAuthSession();
      if (!session.authenticated || !session.user) {
        setUser(undefined);
        setState("unauthenticated");
        return;
      }

      const userLogin = session.user.login.trim().toLowerCase();
      if (!allowedLogin) {
        setUser(undefined);
        setError("Missing VITE_ALLOWED_GITHUB_LOGIN");
        setState("error");
        return;
      }

      if (userLogin !== allowedLogin) {
        setUser(session.user);
        setState("unauthorized");
        return;
      }

      setUser(session.user);
      setState("authenticated");
    } catch (err) {
      setUser(undefined);
      setState("error");
      setError(err instanceof Error ? err.message : "Authentication failed");
    }
  }

  useEffect(() => {
    void refresh();
    // run once; manual refresh handles subsequent checks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    state,
    user,
    error,
    allowedLogin,
    refresh
  };
}
