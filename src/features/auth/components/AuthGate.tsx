import type { PropsWithChildren } from "react";
import { Button } from "../../../shared/ui/primitives";
import { useGitHubAuth } from "../hooks/useGitHubAuth";
import { createGitHubLoginUrl } from "../services/authService";

export function AuthGate({ children }: PropsWithChildren) {
  const { state, user, error, allowedLogin, refresh } = useGitHubAuth();

  if (state === "authenticated") {
    return <>{children}</>;
  }

  return (
    <main className="auth-gate">
      <section className="auth-card stack-sm" aria-live="polite">
        <h1>Party Leader Access</h1>
        <p className="muted">Sign in with GitHub to access the raid control panel.</p>

        {state === "loading" ? <p>Checking session...</p> : null}

        {state === "unauthenticated" ? (
          <>
            <p className="muted">Only the approved GitHub account can enter.</p>
            <Button
              onClick={() => {
                window.location.assign(createGitHubLoginUrl());
              }}
            >
              Sign In With GitHub
            </Button>
          </>
        ) : null}

        {state === "unauthorized" ? (
          <>
            <p role="alert" className="auth-warning">
              Signed in as <strong>{user?.login}</strong>, but access is restricted to <strong>{allowedLogin}</strong>.
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                window.location.assign(createGitHubLoginUrl());
              }}
            >
              Sign In With Different Account
            </Button>
          </>
        ) : null}

        {state === "error" ? (
          <>
            <p role="alert" className="auth-warning">{error ?? "Authentication is unavailable."}</p>
            <div className="row-wrap gap-xs">
              <Button variant="secondary" onClick={() => void refresh()}>
                Retry
              </Button>
              <Button
                onClick={() => {
                  window.location.assign(createGitHubLoginUrl());
                }}
              >
                Continue To GitHub Sign-In
              </Button>
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
