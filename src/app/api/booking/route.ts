import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { bookingSchema, validateFiles } from "@/lib/booking-schema";
import { sendBookingEmail } from "@/lib/send-booking-email";
import { storeBookingPhotos } from "@/lib/booking-photos";
import { prisma } from "@/lib/prisma";
import type { Booking } from "@prisma/client";
import { logger } from "@/lib/logger";
import { supabaseServer } from "@/lib/supabase/server";

// Simple in-memory rate limiter for fallback (not distributed)
class MemoryStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  async limit(key: string, limit: number, window: number) {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || record.resetTime < now) {
      this.store.set(key, { count: 1, resetTime: now + window });
      return { success: true, limit, remaining: limit - 1, reset: now + window };
    }

    if (record.count < limit) {
      record.count++;
      return { success: true, limit, remaining: limit - record.count, reset: record.resetTime };
    }

    return { success: false, limit, remaining: 0, reset: record.resetTime };
  }
}

// Initialize rate limiter: 5 requests per hour per IP
const ratelimit = process.env.UPSTASH_REDIS_REST_URL
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.fixedWindow(5, "1 h"), // 5 requests per hour
      analytics: true,
    })
  : null;

const memoryStore = new MemoryStore();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

export async function POST(request: Request) {
  // Rate limiting: Check IP and apply rate limit
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  
  try {
    let limitResult;
    if (ratelimit) {
      // Use Redis-based rate limiting
      limitResult = await ratelimit.limit(ip);
    } else {
      // Use in-memory rate limiting
      limitResult = await memoryStore.limit(ip, 5, RATE_LIMIT_WINDOW);
    }

    const { success, limit, remaining, reset } = limitResult;

    if (!success) {
      console.error("[booking] Rate limit exceeded for IP:", ip, { remaining, reset });
      return NextResponse.json(
        { success: false, error: "Too many booking attempts. Please try again in an hour." },
        { 
          status: 429, 
          headers: { 
            "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": String(remaining),
          } 
        }
      );
    }
  } catch (err) {
    // If rate limiting fails, log but allow request to proceed
    console.error("[booking] Rate limit check failed:", err);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const raw = Object.fromEntries(
    Array.from(form.entries()).filter(([, v]) => typeof v === "string"),
  );
  const parsed = bookingSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const files = form.getAll("photos").filter((v): v is File => v instanceof File && v.size > 0);
  const fileCheck = validateFiles(files);
  if (!fileCheck.ok) {
    return NextResponse.json(
      { error: "validation", fieldErrors: { photos: [fileCheck.message] } },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // If a customer is signed in AND the form email matches their auth email,
  // attach the new Customer row to their user id. Mismatched emails get
  // treated as a guest booking — we don't want to silently rebind their
  // account to a different email.
  let linkUserId: string | undefined;
  try {
    const supabase = await supabaseServer();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (user?.email && user.email.toLowerCase() === data.email.toLowerCase()) {
      const { data: roleRow } = await supabase
        .from("user_role")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!roleRow) linkUserId = user.id;
    }
  } catch (err) {
    logger.error("booking", "session lookup failed", err);
  }

  // Upsert customer → upsert vehicle → create booking
  let booking: { id: string } | undefined;
  try {
    const customer = await prisma.customer.upsert({
      where: { email: data.email },
      update: {
        name: data.name,
        phone: data.phone,
        address: data.address,
        city: data.city,
        zip: data.zip,
        ...(linkUserId ? { userId: linkUserId } : {}),
      },
      create: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        zip: data.zip,
        userId: linkUserId,
      },
    });

    const vehicle = await prisma.vehicle.upsert({
      where: {
        // composite unique on customerId + year + make + model + color
        customerId_year_make_model_color: {
          customerId: customer.id,
          year: data.year,
          make: data.make,
          model: data.model,
          color: data.color,
        },
      },
      update: {},
      create: {
        customerId: customer.id,
        year: data.year,
        make: data.make,
        model: data.model,
        color: data.color,
      },
    });

    booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        vehicleId: vehicle.id,
        serviceSlug: data.service,
        date: new Date(data.date),
        timeWindow: data.timeWindow,
        notes: data.notes,
      },
    });

    // Persist any uploaded vehicle photos to blob storage and record their
    // keys on the booking. A photo-storage failure must not lose the booking,
    // so it's caught separately and logged rather than failing the request.
    if (files.length > 0) {
      try {
        const photoKeys = await storeBookingPhotos(booking.id, files);
        booking = await prisma.booking.update({
          where: { id: booking.id },
          data: { photoKeys: photoKeys },
        });
      } catch (err) {
        logger.error("booking", "photo storage failed", {
          error: err instanceof Error ? err.message : String(err),
          bookingId: booking.id,
        });
      }
    }
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : String(err);
    logger.error("booking", "db write failed", {
      error: errorMessage,
      timestamp: new Date().toISOString(),
      email: data.email,
      service: data.service,
    });
    return NextResponse.json(
      { success: false, error: "Booking could not be saved. Please try again." },
      { status: 500 },
    );
  }

  // Capture the photos the customer attached so staff can review them later
  // from the admin booking page. This is best-effort — the booking itself is
  // already persisted, so a storage hiccup here must not fail the request.
  if (files.length > 0) {
    try {
      const photoKeys = await storeBookingPhotos(booking.id, files);
      if (photoKeys.length > 0) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { photoKeys },
        });
      }
    } catch (err) {
      logger.error("booking", "photo storage failed", {
        error: err instanceof Error ? err.message : String(err),
        bookingId: booking?.id,
      });
    }
  }

  // Only send email if database write succeeded
  try {
    await sendBookingEmail({ data, files });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : String(err);
    console.error("[booking] send-email failed", {
      error: errorMessage,
      timestamp: new Date().toISOString(),
      bookingId: booking?.id,
      email: data.email,
    });
    // Email failure is not critical — booking persisted successfully
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}

