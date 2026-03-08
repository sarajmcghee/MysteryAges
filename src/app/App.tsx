import { AuthGate } from "../features/auth/components/AuthGate";
import { RaidPage } from "../features/raid/components/RaidPage";

export function App() {
  return (
    <AuthGate>
      <RaidPage />
    </AuthGate>
  );
}
