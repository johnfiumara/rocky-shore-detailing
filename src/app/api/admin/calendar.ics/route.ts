import { NextResponse } from "next/server";
import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildIcs } from "@/lib/ical";
import { formatTime } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const expected = process.env.CALENDAR_FEED_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { error: "CALENDAR_FEED_TOKEN is not configured" },
      { status: 503 },
    );
  }

  const token = new URL(request.url).searchParams.get("token");
  if (token !== expected) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const bookings = await prisma.booking.findMany({
    where: { status: { not: BookingStatus.CANCELLED } },
    include: { customer: true, vehicle: true },
    orderBy: { date: "asc" },
  });

  const ics = buildIcs(
    bookings.map((b) => ({
      uid: `${b.id}@rockycoastdetailing`,
      date: b.date,
      summary: `${b.serviceSlug.replace(/-/g, " ")} — ${b.customer.name}`,
      description: [
        `Status: ${b.status}`,
        `Window: ${formatTime(b.timeWindow)}`,
        `Vehicle: ${b.vehicle.year} ${b.vehicle.make} ${b.vehicle.model}`,
        b.customer.phone ? `Phone: ${b.customer.phone}` : "",
        b.notes ? `Notes: ${b.notes}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      location: [b.customer.address, b.customer.city, b.customer.zip]
        .filter(Boolean)
        .join(", "),
    })),
  );

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
