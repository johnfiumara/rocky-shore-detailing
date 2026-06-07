import type { BookingStatus } from "@prisma/client";

const CLASSES: Record<BookingStatus, string> = {
  PENDING: "bg-line text-bone-dim",
  CONFIRMED: "bg-bronze/10 text-bronze",
  IN_PROGRESS: "bg-emerald-400/10 text-emerald-400",
  COMPLETED: "bg-emerald-400/20 text-emerald-300",
  CANCELLED: "bg-red-400/10 text-red-300",
};

const LABELS: Record<BookingStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs ${CLASSES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
