import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";
import Link from "next/link";
import { formatDate, formatTime } from "@/lib/format";

export const metadata = { title: "Bookings" };

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

function isValidStatus(s: string): s is BookingStatus {
  return Object.values(BookingStatus).includes(s as BookingStatus);
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("admin");
  const { status } = await searchParams;

  const bookings = await prisma.booking.findMany({
    where: status && isValidStatus(status) ? { status } : undefined,
    orderBy: { date: "asc" },
    include: { customer: true, vehicle: true },
  });

  return (
    <div className="p-6 md:p-8 pt-20 md:pt-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display text-bone">Bookings</h1>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={opt.value ? `/admin/bookings?status=${opt.value}` : "/admin/bookings"}
            className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
              (status ?? "") === opt.value
                ? "border-bronze text-bronze bg-bronze/10"
                : "border-line text-bone-dim hover:border-bone/40"
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      <div className="border border-line rounded-xl overflow-hidden">
        {bookings.length === 0 ? (
          <p className="text-bone-dim text-sm p-6">No bookings found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="px-4 py-3 text-bone-dim font-normal text-xs uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-bone-dim font-normal text-xs uppercase tracking-wider hidden sm:table-cell">Vehicle</th>
                <th className="px-4 py-3 text-bone-dim font-normal text-xs uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-bone-dim font-normal text-xs uppercase tracking-wider hidden md:table-cell">Time</th>
                <th className="px-4 py-3 text-bone-dim font-normal text-xs uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b border-line last:border-0 hover:bg-surface/50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/bookings/${b.id}`} className="hover:text-bronze transition-colors">
                      {b.customer.name}
                    </Link>
                    <p className="text-bone-dim text-xs">{b.serviceSlug.replace(/-/g, " ")}</p>
                  </td>
                  <td className="px-4 py-3 text-bone-dim hidden sm:table-cell">
                    {b.vehicle.year} {b.vehicle.make} {b.vehicle.model}
                  </td>
                  <td className="px-4 py-3 text-bone-dim">{formatDate(b.date)}</td>
                  <td className="px-4 py-3 text-bone-dim hidden md:table-cell">{formatTime(b.timeWindow)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={b.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const map: Record<BookingStatus, { label: string; className: string }> = {
    PENDING: { label: "Pending", className: "bg-amber-400/10 text-amber-400" },
    CONFIRMED: { label: "Confirmed", className: "bg-emerald-400/10 text-emerald-400" },
    IN_PROGRESS: { label: "In Progress", className: "bg-blue-400/10 text-blue-400" },
    COMPLETED: { label: "Completed", className: "bg-bone/10 text-bone-dim" },
    CANCELLED: { label: "Cancelled", className: "bg-red-400/10 text-red-400" },
  };
  const { label, className } = map[status];
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${className}`}>{label}</span>;
}
