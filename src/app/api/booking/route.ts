import { NextResponse } from "next/server";
import { bookingSchema, validateFiles } from "@/lib/booking-schema";
import { sendBookingEmail } from "@/lib/send-booking-email";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
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

  // Upsert customer → upsert vehicle → create booking
  try {
    const customer = await prisma.customer.upsert({
      where: { email: data.email },
      update: {
        name: data.name,
        phone: data.phone,
        address: data.address,
        city: data.city,
        zip: data.zip,
      },
      create: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        zip: data.zip,
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

    await prisma.booking.create({
      data: {
        customerId: customer.id,
        vehicleId: vehicle.id,
        serviceSlug: data.service,
        date: new Date(data.date),
        timeWindow: data.timeWindow,
        notes: data.notes,
      },
    });
  } catch (err) {
    console.error("[booking] db write failed", err);
    // Don't block the user — still send email below
  }

  try {
    await sendBookingEmail({ data, files });
  } catch (err) {
    console.error("[booking] send failed", err);
    return NextResponse.json({ error: "send-failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

