"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BookingStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

// ─── Auth ───────────────────────────────────────────────────────────────────

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

// ─── Bookings ───────────────────────────────────────────────────────────────

export async function updateBookingStatus(id: string, status: BookingStatus) {
  await requireRole("admin");
  await prisma.booking.update({ where: { id }, data: { status } });
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${id}`);
}

export async function updateBookingAdminNotes(id: string, adminNotes: string) {
  await requireRole("admin");
  await prisma.booking.update({ where: { id }, data: { adminNotes } });
  revalidatePath(`/admin/bookings/${id}`);
}

export async function updateBookingPrice(id: string, price: number) {
  await requireRole("admin");
  await prisma.booking.update({ where: { id }, data: { price } });
  revalidatePath(`/admin/bookings/${id}`);
}

// ─── Customers ──────────────────────────────────────────────────────────────

export async function updateCustomerNotes(id: string, notes: string) {
  await requireRole("admin");
  await prisma.customer.update({ where: { id }, data: { notes } });
  revalidatePath(`/admin/customers/${id}`);
}

// ─── Content: Services ──────────────────────────────────────────────────────

export async function updateServiceTierPrice(tierId: string, price: number) {
  await requireRole("admin", "editor");
  await prisma.serviceTier.update({ where: { id: tierId }, data: { price } });
  revalidatePath("/admin/content");
}

export async function toggleServiceActive(serviceId: string, active: boolean) {
  await requireRole("admin", "editor");
  await prisma.service.update({ where: { id: serviceId }, data: { active } });
  revalidatePath("/admin/content");
}

// ─── Content: Testimonials ───────────────────────────────────────────────────

export async function createTestimonial(_: unknown, formData: FormData) {
  await requireRole("admin", "editor");
  const quote = formData.get("quote") as string;
  const name = formData.get("name") as string;
  const context = formData.get("context") as string;
  if (!quote || !name || !context) return { error: "All fields are required" };
  await prisma.testimonial.create({ data: { quote, name, context } });
  revalidatePath("/admin/content");
  return { ok: true };
}

export async function deleteTestimonial(id: string) {
  await requireRole("admin", "editor");
  await prisma.testimonial.delete({ where: { id } });
  revalidatePath("/admin/content");
}

export async function toggleTestimonialPublished(id: string, published: boolean) {
  await requireRole("admin", "editor");
  await prisma.testimonial.update({ where: { id }, data: { published } });
  revalidatePath("/admin/content");
}

// ─── Content: FAQ ────────────────────────────────────────────────────────────

export async function createFaqItem(_: unknown, formData: FormData) {
  await requireRole("admin", "editor");
  const question = formData.get("question") as string;
  const answer = formData.get("answer") as string;
  if (!question || !answer) return { error: "All fields are required" };
  await prisma.faqItem.create({ data: { question, answer } });
  revalidatePath("/admin/content");
  return { ok: true };
}

export async function deleteFaqItem(id: string) {
  await requireRole("admin", "editor");
  await prisma.faqItem.delete({ where: { id } });
  revalidatePath("/admin/content");
}
