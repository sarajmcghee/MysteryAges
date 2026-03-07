import type { PropsWithChildren } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";

export function Providers({ children }: PropsWithChildren) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
