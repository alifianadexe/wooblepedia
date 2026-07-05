import type { CSSProperties, ReactNode } from "react";

export function ScopeScreen({
  children,
  label,
  style,
}: {
  children: ReactNode;
  label?: string;
  style?: CSSProperties;
}) {
  return (
    <div className="scope-screen" role="group" aria-label={label} style={style}>
      {children}
    </div>
  );
}
