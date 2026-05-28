import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDate, formatTime } from "@/lib/format";
import { BookingStatus } from "@prisma/client";

export const metadata = { title: "Schedule" };

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  await requireSession();

  const sp = await searchParams;
  const now = new Date();
  const year = parseInt(sp.year ?? "") || now.getFullYear();
  const month = parseInt(sp.month ?? "") || now.getMonth(); // 0-indexed

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

  const bookings = await prisma.booking.findMany({
    where: {
      date: { gte: monthStart, lte: monthEnd },
      status: { not: BookingStatus.CANCELLED },
    },
    include: { customer: true },
    orderBy: { date: "asc" },
  });

  // Index bookings by day-of-month
  const byDay = bookings.reduce<Record<number, typeof bookings>>((acc, b) => {
    const d = new Date(b.date).getUTCDate();
    (acc[d] ??= []).push(b);
    return acc;
  }, {});

  const firstDow = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = month === 0 ? { month: 11, year: year - 1 } : { month: month - 1, year };
  const nextMonth = month === 11 ? { month: 0, year: year + 1 } : { month: month + 1, year };

  return (
    <div className="p-6 md:p-8 pt-20 md:pt-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display text-bone">Schedule</h1>
        <div className="flex items-center gap-3 text-sm">
          <Link href={`/admin/schedule?month=${prevMonth.month}&year=${prevMonth.year}`} className="text-bone-dim hover:text-bone transition-colors px-2">←</Link>
          <span className="text-bone">{MONTHS[month]} {year}</span>
          <Link href={`/admin/schedule?month=${nextMonth.month}&year=${nextMonth.year}`} className="text-bone-dim hover:text-bone transition-colors px-2">→</Link>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="border border-line rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-line">
          {DAYS.map((d) => (
            <div key={d} className="py-2 text-center text-xs text-bone-dim uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const jobs = day ? (byDay[day] ?? []) : [];
            const isToday =
              day === now.getDate() &&
              month === now.getMonth() &&
              year === now.getFullYear();

            return (
              <div
                key={i}
                className={`min-h-[80px] p-1.5 border-b border-r border-line ${
                  !day ? "bg-surface/30" : ""
                } ${i % 7 === 6 ? "border-r-0" : ""}`}
              >
                {day && (
                  <>
                    <span className={`text-xs block mb-1 w-5 h-5 flex items-center justify-center rounded-full ${isToday ? "bg-bronze text-ink font-semibold" : "text-bone-dim"}`}>
                      {day}
                    </span>
                    {jobs.map((b) => (
                      <Link
                        key={b.id}
                        href={`/admin/bookings/${b.id}`}
                        className="block text-[10px] leading-tight bg-bronze/10 text-bronze rounded px-1 py-0.5 mb-0.5 hover:bg-bronze/20 transition-colors truncate"
                      >
                        {b.customer.name}
                      </Link>
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming list */}
      {bookings.length > 0 && (
        <div>
          <h2 className="text-bone-dim text-xs uppercase tracking-wider mb-3">This month</h2>
          <div className="space-y-2">
            {bookings.map((b) => (
              <Link
                key={b.id}
                href={`/admin/bookings/${b.id}`}
                className="flex items-center justify-between border border-line rounded-xl px-4 py-3 hover:border-bronze/40 transition-colors"
              >
                <div>
                  <p className="text-bone text-sm">{b.customer.name}</p>
                  <p className="text-bone-dim text-xs">{b.serviceSlug.replace(/-/g, " ")}</p>
                </div>
                <div className="text-right">
                  <p className="text-bone-dim text-sm">{formatDate(b.date)}</p>
                  <p className="text-bone-dim text-xs">{formatTime(b.timeWindow)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
