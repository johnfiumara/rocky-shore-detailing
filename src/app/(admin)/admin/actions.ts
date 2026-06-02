"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BookingStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { SERVICE_SLUGS, TIME_WINDOWS } from "@/lib/booking-schema";
import { logger } from "@/lib/logger";
import { sanitizeHtml } from "@/lib/sanitize";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export async function login(_: unknown, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    return { error: first.email?.[0] ?? first.password?.[0] ?? "Invalid form" };
  }
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Incorrect email or password" };
  redirect("/admin");
}

export async function logout() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

const passwordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords don't match",
  });

export async function changePassword(_: unknown, formData: FormData) {
  await requireRole("admin", "editor");
  const parsed = passwordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    const f = parsed.error.flatten().fieldErrors;
    return { error: f.password?.[0] ?? f.confirm?.[0] ?? "Invalid input" };
  }
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    logger.error("change-password", "Supabase rejected password update", error);
    return { error: "Could not update password. Try again." };
  }
  return { ok: true };
}

const manualBookingSchema = z.object({
  service: z.enum(SERVICE_SLUGS, { message: "Select a service" }),
  date: z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Pick a valid date"),
  timeWindow: z.enum(TIME_WINDOWS, { message: "Pick a time window" }),
  status: z.enum(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED"]).default("CONFIRMED"),
  price: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number().nonnegative("Price must be 0 or greater").optional(),
  ),

  name: z.string().trim().min(1, "Customer name is required").max(80),
  email: z.string().trim().email("Use a valid email").max(120),
  phone: z.string().trim().max(20).optional().default(""),
  address: z.string().trim().max(120).optional().default(""),
  city: z.string().trim().max(60).optional().default(""),
  zip: z.string().trim().max(10).optional().default(""),

  year: z.coerce.number().int().min(1900).max(2030),
  make: z.string().trim().min(1, "Make is required").max(40),
  model: z.string().trim().min(1, "Model is required").max(40),
  color: z.string().trim().min(1, "Color is required").max(30),

  notes: z.string().trim().max(1000).optional().default(""),
  adminNotes: z.string().trim().max(2000).optional().default(""),
});

export async function createManualBooking(_: unknown, formData: FormData) {
  // CSRF-protected via Next.js Server Actions + SameSite cookies
  await requireRole("admin");
  const raw = Object.fromEntries(
    Array.from(formData.entries()).filter(([, v]) => typeof v === "string"),
  );
  const parsed = manualBookingSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const d = parsed.data;

  try {
    const customer = await prisma.customer.upsert({
      where: { email: d.email },
      update: {
        name: d.name,
        phone: d.phone || null,
        address: d.address || null,
        city: d.city || null,
        zip: d.zip || null,
      },
      create: {
        name: d.name,
        email: d.email,
        phone: d.phone || null,
        address: d.address || null,
        city: d.city || null,
        zip: d.zip || null,
      },
    });

    const vehicle = await prisma.vehicle.upsert({
      where: {
        customerId_year_make_model_color: {
          customerId: customer.id,
          year: d.year,
          make: d.make,
          model: d.model,
          color: d.color,
        },
      },
      update: {},
      create: {
        customerId: customer.id,
        year: d.year,
        make: d.make,
        model: d.model,
        color: d.color,
      },
    });

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        vehicleId: vehicle.id,
        serviceSlug: d.service,
        date: new Date(d.date),
        timeWindow: d.timeWindow,
        status: d.status,
        price: d.price ?? null,
        notes: d.notes || null,
        adminNotes: d.adminNotes || null,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/bookings");
    revalidatePath("/admin/schedule");
    revalidatePath("/admin/customers");
    redirect(`/admin/bookings/${booking.id}`);
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) throw err; // re-throw redirect
    logger.error("manual-booking", "Failed to create booking", err);
    return { error: "Could not save booking. Try again." };
  }
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  // CSRF-protected via Next.js Server Actions + SameSite cookies
  await requireRole("admin");
  await prisma.booking.update({ where: { id }, data: { status } });
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/bookings/" + id);
}

export async function updateBookingAdminNotes(id: string, adminNotes: string) {
  // CSRF-protected via Next.js Server Actions + SameSite cookies
  await requireRole("admin");
  await prisma.booking.update({ where: { id }, data: { adminNotes } });
  revalidatePath("/admin/bookings/" + id);
}

export async function updateBookingPrice(id: string, price: number) {
  // CSRF-protected via Next.js Server Actions + SameSite cookies
  await requireRole("admin");
  await prisma.booking.update({ where: { id }, data: { price } });
  revalidatePath("/admin/bookings/" + id);
}

export async function updateCustomerNotes(id: string, notes: string) {
  await requireRole("admin");
  await prisma.customer.update({ where: { id }, data: { notes } });
  revalidatePath("/admin/customers/" + id);
}

export async function updateServiceTierPrice(tierId: string, price: number) {
  await requireRole("admin", "editor");
  await prisma.serviceTier.update({ where: { id: tierId }, data: { price } });
  revalidatePath("/");
  revalidatePath("/admin/content");
}

export async function toggleServiceActive(serviceId: string, active: boolean) {
  await requireRole("admin", "editor");
  await prisma.service.update({ where: { id: serviceId }, data: { active } });
  revalidatePath("/");
  revalidatePath("/admin/content");
}

export async function updateServiceDescription(serviceId: string, description: string) {
  await requireRole("admin", "editor");
  // Sanitize user input to prevent XSS
  await prisma.service.update({
    where: { id: serviceId },
    data: { description: sanitizeHtml(description) },
  });
  revalidatePath("/");
  revalidatePath("/admin/content");
}

export async function reorderServices(updates: { id: string; sortOrder: number }[]) {
  await requireRole("admin", "editor");
  await prisma.$transaction(
    updates.map((u) => prisma.service.update({ where: { id: u.id }, data: { sortOrder: u.sortOrder } }))
  );
  revalidatePath("/");
  revalidatePath("/admin/content");
}

export async function createTestimonial(_: unknown, formData: FormData) {
  // CSRF-protected via Next.js Server Actions + SameSite cookies
  await requireRole("admin", "editor");
  const quote = formData.get("quote") as string;
  const name = formData.get("name") as string;
  const context = formData.get("context") as string;
  if (!quote || !name || !context) return { error: "All fields are required" };
  // Sanitize user input to prevent XSS
  await prisma.testimonial.create({
    data: {
      quote: sanitizeHtml(quote),
      name: sanitizeHtml(name),
      context: sanitizeHtml(context),
    },
  });
  revalidatePath("/");
  revalidatePath("/admin/content");
  return { ok: true };
}

export async function deleteTestimonial(id: string) {
  // CSRF-protected via Next.js Server Actions + SameSite cookies
  await requireRole("admin", "editor");
  await prisma.testimonial.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/admin/content");
}

export async function toggleTestimonialPublished(id: string, published: boolean) {
  await requireRole("admin", "editor");
  await prisma.testimonial.update({ where: { id }, data: { published } });
  revalidatePath("/");
  revalidatePath("/admin/content");
}

export async function updateTestimonial(id: string, data: { quote?: string; name?: string; context?: string }) {
  await requireRole("admin", "editor");
  // Sanitize user input to prevent XSS
  const sanitizedData = {
    quote: data.quote ? sanitizeHtml(data.quote) : undefined,
    name: data.name ? sanitizeHtml(data.name) : undefined,
    context: data.context ? sanitizeHtml(data.context) : undefined,
  };
  await prisma.testimonial.update({ where: { id }, data: sanitizedData });
  revalidatePath("/");
  revalidatePath("/admin/content");
}

export async function reorderTestimonials(updates: { id: string; sortOrder: number }[]) {
  await requireRole("admin", "editor");
  await prisma.$transaction(
    updates.map((u) => prisma.testimonial.update({ where: { id: u.id }, data: { sortOrder: u.sortOrder } }))
  );
  revalidatePath("/");
  revalidatePath("/admin/content");
}

export async function createFaqItem(_: unknown, formData: FormData) {
  // CSRF-protected via Next.js Server Actions + SameSite cookies
  await requireRole("admin", "editor");
  const question = formData.get("question") as string;
  const answer = formData.get("answer") as string;
  if (!question || !answer) return { error: "All fields are required" };
  // Sanitize user input to prevent XSS
  await prisma.faqItem.create({
    data: {
      question: sanitizeHtml(question),
      answer: sanitizeHtml(answer),
    },
  });
  revalidatePath("/");
  revalidatePath("/admin/content");
  return { ok: true };
}

export async function deleteFaqItem(id: string) {
  await requireRole("admin", "editor");
  await prisma.faqItem.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/admin/content");
}

export async function toggleFaqItemPublished(id: string, published: boolean) {
  await requireRole("admin", "editor");
  await prisma.faqItem.update({ where: { id }, data: { published } });
  revalidatePath("/");
  revalidatePath("/admin/content");
}

export async function updateFaqItem(id: string, data: { question?: string; answer?: string }) {
  await requireRole("admin", "editor");
  // Sanitize user input to prevent XSS
  const sanitizedData = {
    question: data.question ? sanitizeHtml(data.question) : undefined,
    answer: data.answer ? sanitizeHtml(data.answer) : undefined,
  };
  await prisma.faqItem.update({ where: { id }, data: sanitizedData });
  revalidatePath("/");
  revalidatePath("/admin/content");
}

export async function reorderFaqItems(updates: { id: string; sortOrder: number }[]) {
  await requireRole("admin", "editor");
  await prisma.$transaction(
    updates.map((u) => prisma.faqItem.update({ where: { id: u.id }, data: { sortOrder: u.sortOrder } }))
  );
  revalidatePath("/");
  revalidatePath("/admin/content");
}

export async function updateGalleryImage(id: string, data: { alt?: string; label?: string; isBefore?: boolean; isAfter?: boolean }) {
  await requireRole("admin", "editor");
  // Sanitize user input to prevent XSS
  const sanitizedData = {
    alt: data.alt ? sanitizeHtml(data.alt) : undefined,
    label: data.label ? sanitizeHtml(data.label) : undefined,
    isBefore: data.isBefore,
    isAfter: data.isAfter,
  };
  await prisma.galleryImage.update({ where: { id }, data: sanitizedData });
  revalidatePath("/");
  revalidatePath("/admin/gallery");
}

export async function toggleGalleryImagePublished(id: string, published: boolean) {
  await requireRole("admin", "editor");
  await prisma.galleryImage.update({ where: { id }, data: { published } });
  revalidatePath("/");
  revalidatePath("/admin/gallery");
}

export async function reorderGalleryImages(updates: { id: string; sortOrder: number }[]) {
  await requireRole("admin", "editor");
  await prisma.$transaction(
    updates.map((u) => prisma.galleryImage.update({ where: { id: u.id }, data: { sortOrder: u.sortOrder } }))
  );
  revalidatePath("/");
  revalidatePath("/admin/gallery");
}

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------

const expenseSchema = z.object({
  date: z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Pick a valid date"),
  category: z.string().trim().min(1, "Category is required").max(40),
  description: z.string().trim().min(1, "Description is required").max(200),
  amount: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number().positive("Amount must be greater than 0"),
  ),
  vendor: z.string().trim().max(80).optional().default(""),
  notes: z.string().trim().max(1000).optional().default(""),
});

export async function createExpense(_: unknown, formData: FormData) {
  // CSRF-protected via Next.js Server Actions + SameSite cookies
  await requireRole("admin", "editor");
  const parsed = expenseSchema.safeParse({
    date: formData.get("date"),
    category: formData.get("category"),
    description: formData.get("description"),
    amount: formData.get("amount"),
    vendor: formData.get("vendor"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    const f = parsed.error.flatten().fieldErrors;
    return {
      error:
        f.date?.[0] ??
        f.category?.[0] ??
        f.description?.[0] ??
        f.amount?.[0] ??
        "Please fill in the required fields.",
    };
  }
  const d = parsed.data;
  await prisma.expense.create({
    data: {
      date: new Date(d.date),
      category: d.category,
      description: d.description,
      amount: d.amount,
      vendor: d.vendor || null,
      notes: d.notes || null,
    },
  });
  revalidatePath("/admin/expenses");
  revalidatePath("/admin/budget");
  return { ok: true };
}

export async function deleteExpense(id: string) {
  // CSRF-protected via Next.js Server Actions + SameSite cookies
  await requireRole("admin");
  await prisma.expense.delete({ where: { id } });
  revalidatePath("/admin/expenses");
  revalidatePath("/admin/budget");
}

// ---------------------------------------------------------------------------
// Customer communication log
// ---------------------------------------------------------------------------

const messageSchema = z.object({
  customerId: z.string().min(1),
  bookingId: z.string().optional().default(""),
  channel: z.enum(["phone", "text", "email", "in-person", "other"]),
  direction: z.enum(["inbound", "outbound", "internal"]),
  body: z.string().trim().min(1, "Message is required").max(2000),
});

export async function createCustomerMessage(_: unknown, formData: FormData) {
  // CSRF-protected via Next.js Server Actions + SameSite cookies
  await requireRole("admin", "editor");
  const parsed = messageSchema.safeParse({
    customerId: formData.get("customerId"),
    bookingId: formData.get("bookingId"),
    channel: formData.get("channel"),
    direction: formData.get("direction"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    const f = parsed.error.flatten().fieldErrors;
    return { error: f.body?.[0] ?? f.channel?.[0] ?? f.direction?.[0] ?? "Invalid message" };
  }
  const d = parsed.data;
  await prisma.customerMessage.create({
    data: {
      customerId: d.customerId,
      bookingId: d.bookingId || null,
      channel: d.channel,
      direction: d.direction,
      body: d.body,
    },
  });
  revalidatePath("/admin/customers/" + d.customerId);
  return { ok: true };
}

export async function deleteCustomerMessage(id: string, customerId: string) {
  await requireRole("admin", "editor");
  await prisma.customerMessage.delete({ where: { id } });
  revalidatePath("/admin/customers/" + customerId);
}

