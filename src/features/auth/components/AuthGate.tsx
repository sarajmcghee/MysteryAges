import { type PropsWithChildren, useState } from "react";
import { Button } from "../../../shared/ui/primitives";
import { useGitHubAuth } from "../hooks/useGitHubAuth";
import { createGitHubLoginUrl } from "../services/authService";
import { isGuestModeEnabled, setGuestModeEnabled } from "../state/guestMode";

export function AuthGate({ children }: PropsWithChildren) {
  const { state, user, error, allowedLogin, refresh } = useGitHubAuth();
  const [isGuestMode, setIsGuestMode] = useState(() => isGuestModeEnabled());
  const login = () => {
    setGuestModeEnabled(false);
    setIsGuestMode(false);
    window.location.assign(createGitHubLoginUrl());
  };

  if (state === "authenticated" || isGuestMode) {
    return <>{children}</>;
  }

  return (
    <main className="auth-gate">
      <section className="auth-card" aria-live="polite">
        <div className="auth-scene" aria-hidden="true">
          <img className="auth-scene__image" src={`${import.meta.env.BASE_URL}dogma-reference.jpg`} alt="" />
          <div className="auth-scene__veil" />
          <p className="auth-scene__caption">
            You approach the Lantern & Ledger... Cozy Tavern - First Floor 2 by Nick Slough [CC-BY] via Poly Pizza
          </p>
        </div>

        <div className="stack-sm">
          <p className="auth-kicker">Party Leader Access</p>
          <h1>The tavern door is open. Your table is waiting.</h1>
          <p className="muted">
            Continue with GitHub Login and step inside. The hearth is warm, the backlog is not.
          </p>

          {state === "loading" ? <p className="muted">Booting the lanterns and checking your seal...</p> : null}

          {state === "unauthenticated" ? (
            <div className="row-wrap gap-xs">
              <Button onClick={login}>Continue With GitHub Login</Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setGuestModeEnabled(true);
                  setIsGuestMode(true);
                }}
              >
                Continue as Guest
              </Button>
              <p className="auth-hint">Approved party members only.</p>
            </div>
          ) : null}

          {state === "unauthorized" ? (
            <>
              <p role="alert" className="auth-warning">
                Signed in as <strong>{user?.login}</strong>, but this booth is reserved for <strong>{allowedLogin}</strong>.
              </p>
              <Button variant="secondary" onClick={login}>
                Try Another GitHub Account
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setGuestModeEnabled(true);
                  setIsGuestMode(true);
                }}
              >
                Continue as Guest
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
                <Button onClick={login}>Continue With GitHub Login</Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setGuestModeEnabled(true);
                    setIsGuestMode(true);
                  }}
                >
                  Continue as Guest
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </section>
    </main>
  );
}
