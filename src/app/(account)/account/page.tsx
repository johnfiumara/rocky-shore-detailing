import Link from "next/link";
import { requireCustomer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatTime } from "@/lib/format";
import { customerLogout } from "./actions";
import StatusBadge from "./status-badge";

export const metadata = { title: "Your bookings" };

export default async function AccountPage() {
  const session = await requireCustomer();

  const [bookings, vehicles] = await Promise.all([
    prisma.booking.findMany({
      where: { customerId: session.customer.id },
      include: { vehicle: true },
      orderBy: [{ date: "desc" }],
    }),
    prisma.vehicle.findMany({
      where: { customerId: session.customer.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const calendarHref = "/api/account/calendar.ics";

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-3xl mx-auto space-y-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-bone">
            Hi {session.customer.name.split(" ")[0] || "there"}
          </h1>
          <p className="text-bone-dim text-sm mt-1">{session.email}</p>
        </div>
        <form action={customerLogout}>
          <button
            type="submit"
            className="text-xs uppercase tracking-wider text-bone-dim hover:text-bronze transition-colors"
          >
            Sign out
          </button>
        </form>
      </header>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-bone-dim text-xs uppercase tracking-wider">
            Bookings
          </h2>
          <Link
            href="/#book"
            className="text-xs text-bronze hover:underline"
          >
            Book another →
          </Link>
        </div>

        {bookings.length === 0 ? (
          <p className="text-bone-dim text-sm border border-line rounded-xl p-6">
            No bookings yet.{" "}
            <Link href="/#book" className="text-bronze hover:underline">
              Book your first detail
            </Link>
            .
          </p>
        ) : (
          <ul className="border border-line rounded-xl divide-y divide-line overflow-hidden">
            {bookings.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/account/bookings/${b.id}`}
                  className="block p-4 hover:bg-surface/40 transition-colors"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <div className="text-bone">
                      {formatDate(b.date)} · {formatTime(b.timeWindow)}
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="text-bone-dim text-sm mt-1">
                    {b.serviceSlug.replace(/-/g, " ")} ·{" "}
                    {b.vehicle.year} {b.vehicle.make} {b.vehicle.model}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {vehicles.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-bone-dim text-xs uppercase tracking-wider">
            Your vehicles
          </h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {vehicles.map((v) => (
              <li
                key={v.id}
                className="border border-line rounded-xl p-4 text-bone"
              >
                <div className="text-sm">
                  {v.year} {v.make} {v.model}
                </div>
                <div className="text-bone-dim text-xs mt-0.5">{v.color}</div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-bone-dim text-xs uppercase tracking-wider">
          Calendar
        </h2>
        <p className="text-sm text-bone-dim">
          Subscribe to your bookings in Apple Calendar, Google Calendar, or
          Outlook:{" "}
          <a href={calendarHref} className="text-bronze hover:underline">
            {calendarHref}
          </a>
        </p>
      </section>
    </div>
  );
}
