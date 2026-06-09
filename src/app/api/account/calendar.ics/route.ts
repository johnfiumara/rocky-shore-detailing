import { NextResponse } from "next/server";
import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/auth";
import { buildIcs } from "@/lib/ical";
import { formatTime } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentCustomer();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const bookings = await prisma.booking.findMany({
    where: {
      customerId: session.customer.id,
      status: { not: BookingStatus.CANCELLED },
    },
    include: { vehicle: true },
    orderBy: { date: "asc" },
  });

  const ics = buildIcs(
    bookings.map((b) => ({
      uid: `${b.id}@rockycoastdetailing`,
      date: b.date,
      summary: `Rocky Coast — ${b.serviceSlug.replace(/-/g, " ")}`,
      description: [
        `Window: ${formatTime(b.timeWindow)}`,
        `Vehicle: ${b.vehicle.year} ${b.vehicle.make} ${b.vehicle.model}`,
        `Status: ${b.status}`,
      ].join("\n"),
    })),
  );

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
