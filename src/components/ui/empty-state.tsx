import { type ReactNode } from "react";

export function EmptyState({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="text-bone-dim text-sm border border-line rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>{children}</div>
      {action && <div>{action}</div>}
    </div>
  );
}
