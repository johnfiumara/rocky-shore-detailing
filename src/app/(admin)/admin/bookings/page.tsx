import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";
import Link from "next/link";
import { formatDate, formatTime } from "@/lib/format";
import { StatusBadge } from "../_components/status-badge";
import { Pagination, parsePageParams } from "../_components/pagination";

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

type SearchParams = {
  status?: string;
  page?: string;
  pageSize?: string;
};

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireRole("admin");
  const params = await searchParams;
  const { status } = params;
  const { page, pageSize, skip, take } = parsePageParams(params);

  const where = status && isValidStatus(status) ? { status } : undefined;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { date: "asc" },
      include: { customer: true, vehicle: true },
      skip,
      take,
    }),
    prisma.booking.count({ where }),
  ]);

  return (
    <div className="p-6 md:p-8 pt-20 md:pt-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-display text-bone">Bookings</h1>
        <Link href="/admin/bookings/new" className="btn-primary text-sm">
          + New booking
        </Link>
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

      <Pagination
        basePath="/admin/bookings"
        page={page}
        pageSize={pageSize}
        total={total}
        preserve={{ status }}
      />
    </div>
  );
}
