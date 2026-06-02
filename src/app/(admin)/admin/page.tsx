import { requireRole } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "./_components/status-badge";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  await requireRole("admin", "editor");

  const [supabase, pendingCount, confirmedCount, customerCount, recentBookings] = await Promise.all([
    supabaseServer(),
    prisma.booking.count({ where: { status: BookingStatus.PENDING } }),
    prisma.booking.count({ where: { status: BookingStatus.CONFIRMED } }),
    prisma.customer.count(),
    prisma.booking.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { customer: true, vehicle: true },
    }),
  ]);

  const { data: userData } = await supabase.auth.getUser();
  const greetingName = userData.user?.email?.split("@")[0] ?? "there";

  const stats = [
    { label: "Pending", value: pendingCount, href: "/admin/bookings?status=PENDING", accent: "text-amber-400" },
    { label: "Confirmed", value: confirmedCount, href: "/admin/bookings?status=CONFIRMED", accent: "text-emerald-400" },
    { label: "Customers", value: customerCount, href: "/admin/customers", accent: "text-bronze" },
  ];

  return (
    <div className="p-6 md:p-8 pt-20 md:pt-8 max-w-5xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-display text-bone">Dashboard</h1>
        <p className="text-bone-dim text-sm mt-1">Welcome back, {greetingName}.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="border border-line rounded-xl p-5 bg-surface hover:border-bronze/40 transition-colors"
          >
            <p className={`text-3xl font-display ${s.accent}`}>{s.value}</p>
            <p className="text-bone-dim text-sm mt-1">{s.label}</p>
          </Link>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-mono-accent tracking-widest uppercase text-bone-dim">Recent Bookings</h2>
          <Link href="/admin/bookings" className="text-xs text-bronze hover:underline">View all</Link>
        </div>
        <div className="border border-line rounded-xl overflow-hidden">
          {recentBookings.length === 0 ? (
            <p className="text-bone-dim text-sm p-6">No bookings yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="px-4 py-3 text-bone-dim font-normal text-xs uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-bone-dim font-normal text-xs uppercase tracking-wider hidden md:table-cell">Vehicle</th>
                  <th className="px-4 py-3 text-bone-dim font-normal text-xs uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-bone-dim font-normal text-xs uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b.id} className="border-b border-line last:border-0 hover:bg-surface/50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/bookings/${b.id}`} className="hover:text-bronze transition-colors">
                        {b.customer.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-bone-dim hidden md:table-cell">
                      {b.vehicle.year} {b.vehicle.make} {b.vehicle.model}
                    </td>
                    <td className="px-4 py-3 text-bone-dim">{formatDate(b.date)}</td>
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
    </div>
  );
}
