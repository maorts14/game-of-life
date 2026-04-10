import type { PropsWithChildren } from "react";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="relative min-h-[var(--app-stable-vh)] overflow-hidden bg-[#090909] text-slate-100">
      <div className="pointer-events-none absolute inset-0 grid-noise opacity-40" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,240,255,0.2),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.07),transparent_20%)]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
