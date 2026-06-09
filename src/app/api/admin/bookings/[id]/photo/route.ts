import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBookingPhoto, contentTypeForKey } from "@/lib/booking-photos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Streams a single customer-uploaded photo for a booking. Admin/editor only.
// The requested key must be one recorded on the booking, so this can't be used
// to read arbitrary blobs.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireRole("admin", "editor");
  const { id } = await params;

  const key = new URL(request.url).searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    select: { photoKeys: true },
  });
  if (!booking || !booking.photoKeys.includes(key)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const photo = await getBookingPhoto(key);
  if (!photo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(photo, {
    headers: {
      "Content-Type": contentTypeForKey(key),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
