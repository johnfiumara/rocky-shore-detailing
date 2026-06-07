"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase/server";
import { requireCustomer } from "@/lib/auth";
import { logger } from "@/lib/logger";

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export async function customerLogin(_: unknown, formData: FormData) {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const f = parsed.error.flatten().fieldErrors;
    return { error: f.email?.[0] ?? f.password?.[0] ?? "Invalid form" };
  }

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Incorrect email or password" };

  // Block staff users from using the customer side.
  const { data: userData } = await supabase.auth.getUser();
  if (userData?.user) {
    const { data: roleRow } = await supabase
      .from("user_role")
      .select("role")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (roleRow) {
      await supabase.auth.signOut();
      return { error: "Staff accounts must sign in at /admin/login." };
    }
  }

  redirect("/account");
}

const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(120),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function customerSignup(_: unknown, formData: FormData) {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const f = parsed.error.flatten().fieldErrors;
    return {
      error:
        f.name?.[0] ?? f.email?.[0] ?? f.password?.[0] ?? "Invalid form",
    };
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${base}/auth/callback`,
      data: { name: parsed.data.name },
    },
  });

  if (error) {
    if (/already registered/i.test(error.message)) {
      return { error: "An account with that email already exists." };
    }
    logger.error("customer-signup", "supabase rejected signup", error);
    return { error: "Could not create account. Try again." };
  }

  // Pre-create / update the Customer so guest bookings get claimed
  // immediately and the dashboard has data the moment they confirm.
  try {
    await prisma.customer.upsert({
      where: { email: parsed.data.email },
      update: {
        name: parsed.data.name,
        userId: data.user?.id ?? undefined,
      },
      create: {
        email: parsed.data.email,
        name: parsed.data.name,
        userId: data.user?.id ?? undefined,
      },
    });
  } catch (err) {
    logger.error("customer-signup", "customer upsert failed", err);
  }

  redirect("/signup?confirm=1");
}

export async function customerLogout() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function cancelMyBooking(bookingId: string) {
  const session = await requireCustomer();

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, customerId: true, status: true, date: true },
  });

  if (!booking || booking.customerId !== session.customer.id) {
    return { error: "Booking not found." };
  }

  if (
    booking.status === BookingStatus.CANCELLED ||
    booking.status === BookingStatus.COMPLETED ||
    booking.status === BookingStatus.IN_PROGRESS
  ) {
    return { error: "This booking can no longer be cancelled." };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (new Date(booking.date) < today) {
    return { error: "This booking has already passed." };
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: BookingStatus.CANCELLED },
  });

  revalidatePath("/account");
  revalidatePath(`/account/bookings/${bookingId}`);
  return { ok: true };
}
