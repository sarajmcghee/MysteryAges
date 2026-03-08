import { AuthGate } from "../features/auth/components/AuthGate";
import { RaidPage } from "../features/raid/components/RaidPage";

function isAuthGateEnabled(): boolean {
  const raw = import.meta.env.VITE_AUTH_GATE_ENABLED;
  if (typeof raw === "string") {
    return raw.trim().toLowerCase() !== "false";
  }
  return true;
}

export function App() {
  if (!isAuthGateEnabled()) {
    return <RaidPage />;
  }

  return (
    <AuthGate>
      <RaidPage />
    </AuthGate>
  );
}
