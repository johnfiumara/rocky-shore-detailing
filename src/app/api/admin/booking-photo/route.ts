import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBookingPhoto, contentTypeForKey } from "@/lib/booking-photos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Serves a customer-uploaded booking photo to authenticated staff. Photos are
// private vehicle/property images, so this never goes through a public URL.
export async function GET(request: Request) {
  const session = await getCurrentUser();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const key = new URL(request.url).searchParams.get("key");
  if (!key) return new NextResponse("Missing key", { status: 400 });

  // Keys are namespaced as `<bookingId>/<n>.<ext>`. Confirm the key actually
  // belongs to a booking before serving so staff can't probe arbitrary blobs.
  const bookingId = key.split("/")[0];
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { photoKeys: true },
  });
  if (!booking || !booking.photoKeys.includes(key)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const data = await getBookingPhoto(key);
  if (!data) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(data, {
    headers: {
      "Content-Type": contentTypeForKey(key),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
