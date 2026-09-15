import type { ReactNode } from "react";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-app">
      <div className="mx-auto min-h-screen w-full max-w-md bg-bg-screen">{children}</div>
    </div>
  );
}
