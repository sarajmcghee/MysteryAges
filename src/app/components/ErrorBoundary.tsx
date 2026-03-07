import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

interface Props {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<Props, ErrorBoundaryState> {
  public constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const message = error instanceof Error ? error.message : "Unknown render error";
    return {
      hasError: true,
      message
    };
  }

  public override componentDidCatch(error: unknown): void {
    console.error("Unhandled render error in raid app", error);
  }

  public override render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div role="alert" style={{ padding: 16 }}>
          <h1>Raid UI crashed</h1>
          <p>The app hit an unexpected error and stopped rendering safely.</p>
          {this.state.message ? <pre>{this.state.message}</pre> : null}
        </div>
      );
    }

    return this.props.children;
  }
}
