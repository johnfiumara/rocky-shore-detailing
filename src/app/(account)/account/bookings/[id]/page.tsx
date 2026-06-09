import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingStatus } from "@prisma/client";
import { requireCustomer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatTime } from "@/lib/format";
import { Badge, Button } from "@/components/ui";
import CancelButton from "./cancel-button";

export const metadata = { title: "Booking detail" };

const CANCELLABLE: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
];

export default async function CustomerBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireCustomer();
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { vehicle: true },
  });

  if (!booking || booking.customerId !== session.customer.id) notFound();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const canCancel =
    CANCELLABLE.includes(booking.status) && new Date(booking.date) >= today;

  return (
    <div className="space-y-8">
      <Link
        href="/account"
        className="text-bone-dim hover:text-bone text-sm transition-colors"
      >
        ← All bookings
      </Link>

      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-2xl font-display text-bone">
            {booking.serviceSlug.replace(/-/g, " ")}
          </h1>
          <Badge status={booking.status} />
        </div>
        <p className="text-bone-dim">
          {formatDate(booking.date)} · {formatTime(booking.timeWindow)}
        </p>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2 border border-line rounded-xl p-5">
        <div>
          <dt className="text-bone-dim text-xs uppercase tracking-wider">
            Vehicle
          </dt>
          <dd className="text-bone text-sm mt-1">
            {booking.vehicle.year} {booking.vehicle.make}{" "}
            {booking.vehicle.model}
            <span className="text-bone-dim"> · {booking.vehicle.color}</span>
          </dd>
        </div>
        {booking.price != null && (
          <div>
            <dt className="text-bone-dim text-xs uppercase tracking-wider">
              Price
            </dt>
            <dd className="text-bone text-sm mt-1">
              ${booking.price.toFixed(2)}
            </dd>
          </div>
        )}
        {booking.notes && (
          <div className="sm:col-span-2">
            <dt className="text-bone-dim text-xs uppercase tracking-wider">
              Your notes
            </dt>
            <dd className="text-bone text-sm mt-1 whitespace-pre-wrap">
              {booking.notes}
            </dd>
          </div>
        )}
      </dl>

      <div className="flex flex-wrap items-center gap-4">
        <Button variant="link" asChild>
          <Link href={`/?rebook=${booking.id}#book`}>Book again →</Link>
        </Button>
        {canCancel ? (
          <CancelButton bookingId={booking.id} />
        ) : booking.status === BookingStatus.CANCELLED ? (
          <p className="text-sm text-bone-dim">This booking is cancelled.</p>
        ) : (
          <p className="text-sm text-bone-dim">
            This booking can no longer be cancelled online. Reach out if you need
            to change it.
          </p>
        )}
      </div>
    </div>
  );
}
