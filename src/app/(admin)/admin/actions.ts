"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  requireSession,
  createSession,
  sessionCookieOptions,
  clearSessionCookie,
} from "@/lib/session";

// ─── Auth ───────────────────────────────────────────────────────────────────

export async function login(_: unknown, formData: FormData) {
  const password = formData.get("password");
  if (typeof password !== "string") return { error: "Invalid request" };

  const hash = process.env.ADMIN_PASSWORD_HASH ?? "";
  const ok = await bcrypt.compare(password, hash);
  if (!ok) return { error: "Incorrect password" };

  const token = await createSession();
  const jar = await cookies();
  jar.set(sessionCookieOptions(token));

  redirect("/admin");
}

export async function logout() {
  const jar = await cookies();
  jar.set(clearSessionCookie());
  redirect("/admin/login");
}

// ─── Bookings ───────────────────────────────────────────────────────────────

export async function updateBookingStatus(id: string, status: BookingStatus) {
  await requireSession();
  await prisma.booking.update({ where: { id }, data: { status } });
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${id}`);
}

export async function updateBookingAdminNotes(id: string, adminNotes: string) {
  await requireSession();
  await prisma.booking.update({ where: { id }, data: { adminNotes } });
  revalidatePath(`/admin/bookings/${id}`);
}

export async function updateBookingPrice(id: string, price: number) {
  await requireSession();
  await prisma.booking.update({ where: { id }, data: { price } });
  revalidatePath(`/admin/bookings/${id}`);
}

// ─── Customers ──────────────────────────────────────────────────────────────

export async function updateCustomerNotes(id: string, notes: string) {
  await requireSession();
  await prisma.customer.update({ where: { id }, data: { notes } });
  revalidatePath(`/admin/customers/${id}`);
}

// ─── Content: Services ──────────────────────────────────────────────────────

export async function updateServiceTierPrice(tierId: string, price: number) {
  await requireSession();
  await prisma.serviceTier.update({ where: { id: tierId }, data: { price } });
  revalidatePath("/admin/content");
}

export async function toggleServiceActive(serviceId: string, active: boolean) {
  await requireSession();
  await prisma.service.update({ where: { id: serviceId }, data: { active } });
  revalidatePath("/admin/content");
}

// ─── Content: Testimonials ───────────────────────────────────────────────────

export async function createTestimonial(_: unknown, formData: FormData) {
  await requireSession();
  const quote = formData.get("quote") as string;
  const name = formData.get("name") as string;
  const context = formData.get("context") as string;
  if (!quote || !name || !context) return { error: "All fields are required" };
  await prisma.testimonial.create({ data: { quote, name, context } });
  revalidatePath("/admin/content");
  return { ok: true };
}

export async function deleteTestimonial(id: string) {
  await requireSession();
  await prisma.testimonial.delete({ where: { id } });
  revalidatePath("/admin/content");
}

export async function toggleTestimonialPublished(id: string, published: boolean) {
  await requireSession();
  await prisma.testimonial.update({ where: { id }, data: { published } });
  revalidatePath("/admin/content");
}

// ─── Content: FAQ ────────────────────────────────────────────────────────────

export async function createFaqItem(_: unknown, formData: FormData) {
  await requireSession();
  const question = formData.get("question") as string;
  const answer = formData.get("answer") as string;
  if (!question || !answer) return { error: "All fields are required" };
  await prisma.faqItem.create({ data: { question, answer } });
  revalidatePath("/admin/content");
  return { ok: true };
}

export async function deleteFaqItem(id: string) {
  await requireSession();
  await prisma.faqItem.delete({ where: { id } });
  revalidatePath("/admin/content");
}
