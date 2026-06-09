import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate, formatTime, formatCurrency } from "@/lib/format";
import BookingActions from "./booking-actions";

export const metadata = { title: "Booking Detail" };

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { customer: true, vehicle: true },
  });

  if (!booking) notFound();

  const fields: { label: string; value: string }[] = [
    { label: "Service", value: booking.serviceSlug.replace(/-/g, " ") },
    { label: "Date", value: formatDate(booking.date) },
    { label: "Time", value: formatTime(booking.timeWindow) },
    { label: "Price", value: booking.price ? formatCurrency(booking.price) : "—" },
    { label: "Notes", value: booking.notes || "—" },
  ];

  return (
    <div className="p-6 md:p-8 pt-20 md:pt-8 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/admin/bookings" className="text-bone-dim hover:text-bone text-sm transition-colors">
          ← Bookings
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display text-bone">{booking.customer.name}</h1>
          <p className="text-bone-dim text-sm mt-1">
            {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model} · {booking.vehicle.color}
          </p>
        </div>
        <BookingActions booking={booking} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.label} className="border border-line rounded-xl p-4">
            <p className="text-bone-dim text-xs uppercase tracking-wider mb-1">{f.label}</p>
            <p className="text-bone text-sm capitalize">{f.value}</p>
          </div>
        ))}
      </div>

      <div className="border border-line rounded-xl p-4 space-y-2">
        <p className="text-bone-dim text-xs uppercase tracking-wider">Contact</p>
        <p className="text-bone text-sm">{booking.customer.email}</p>
        {booking.customer.phone && <p className="text-bone text-sm">{booking.customer.phone}</p>}
        {booking.customer.address && (
          <p className="text-bone-dim text-sm">
            {booking.customer.address}, {booking.customer.city} {booking.customer.zip}
          </p>
        )}
      </div>

      <div className="border border-line rounded-xl p-4">
        <p className="text-bone-dim text-xs uppercase tracking-wider mb-2">Admin Notes</p>
        <p className="text-bone text-sm whitespace-pre-wrap">{booking.adminNotes || "—"}</p>
      </div>

      {booking.photoKeys.length > 0 && (
        <div className="border border-line rounded-xl p-4">
          <p className="text-bone-dim text-xs uppercase tracking-wider mb-3">
            Customer Photos
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {booking.photoKeys.map((key) => {
              const src = `/api/admin/booking-photo?key=${encodeURIComponent(key)}`;
              return (
                <a
                  key={key}
                  href={src}
                  target="_blank"
                  rel="noreferrer"
                  className="block aspect-square overflow-hidden rounded-lg border border-line"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt="Customer-submitted vehicle photo"
                    className="h-full w-full object-cover"
                  />
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
