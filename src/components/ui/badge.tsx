import { BookingStatus } from "@prisma/client";

const STATUS_STYLES: Record<BookingStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-amber-400/10 text-amber-400" },
  CONFIRMED: { label: "Confirmed", className: "bg-emerald-400/10 text-emerald-400" },
  IN_PROGRESS: { label: "In Progress", className: "bg-blue-400/10 text-blue-400" },
  COMPLETED: { label: "Completed", className: "bg-bone/10 text-bone-dim" },
  CANCELLED: { label: "Cancelled", className: "bg-red-400/10 text-red-400" },
};

export function Badge({ status }: { status: BookingStatus }) {
  const { label, className } = STATUS_STYLES[status];
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${className}`}>
      {label}
    </span>
  );
}
