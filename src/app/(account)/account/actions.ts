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

// -----------------------------------------------------------------------------
// Profile & vehicles
// -----------------------------------------------------------------------------

const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  phone: z.union([
    z.string().trim().max(20).regex(/^[+()\-.\s\d]+$/, "Use digits and standard phone characters only"),
    z.literal(""),
  ]).optional(),
  address: z.string().trim().max(120).optional(),
  city: z.string().trim().max(60).optional(),
  zip: z.union([
    z.string().trim().regex(/^\d{5}$/, "Use a 5-digit ZIP"),
    z.literal(""),
  ]).optional(),
});

export async function updateCustomerProfile(_: unknown, formData: FormData) {
  const session = await requireCustomer();

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    city: formData.get("city"),
    zip: formData.get("zip"),
  });

  if (!parsed.success) {
    const f = parsed.error.flatten().fieldErrors;
    return {
      error:
        f.name?.[0] ?? f.phone?.[0] ?? f.address?.[0] ?? f.city?.[0] ?? f.zip?.[0] ?? "Invalid form",
    };
  }

  try {
    await prisma.customer.update({
      where: { id: session.customer.id },
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        address: parsed.data.address || null,
        city: parsed.data.city || null,
        zip: parsed.data.zip || null,
      },
    });
  } catch (err) {
    logger.error("update-customer-profile", "db write failed", err);
    return { error: "Could not save profile. Try again." };
  }

  revalidatePath("/account");
  revalidatePath("/account/profile");
  return { ok: true };
}

const vehicleSchema = z.object({
  year: z.coerce.number().int().min(1900, "Year must be 1900 or later").max(2030, "Year must be 2030 or earlier"),
  make: z.string().trim().min(1, "Make is required").max(40),
  model: z.string().trim().min(1, "Model is required").max(40),
  color: z.string().trim().min(1, "Color is required").max(30),
  isDefault: z.enum(["true", "false"]).default("false"),
});

async function enforceSingleDefault(customerId: string, defaultId?: string) {
  if (!defaultId) return;
  await prisma.vehicle.updateMany({
    where: { customerId, NOT: { id: defaultId } },
    data: { isDefault: false },
  });
}

export async function addCustomerVehicle(_: unknown, formData: FormData) {
  const session = await requireCustomer();

  const parsed = vehicleSchema.safeParse({
    year: formData.get("year"),
    make: formData.get("make"),
    model: formData.get("model"),
    color: formData.get("color"),
    isDefault: formData.get("isDefault"),
  });

  if (!parsed.success) {
    const f = parsed.error.flatten().fieldErrors;
    return {
      error: f.year?.[0] ?? f.make?.[0] ?? f.model?.[0] ?? f.color?.[0] ?? "Invalid form",
    };
  }

  const d = parsed.data;
  const setDefault = d.isDefault === "true";

  try {
    const vehicle = await prisma.$transaction(async (tx) => {
      const existingDefault = await tx.vehicle.findFirst({
        where: { customerId: session.customer.id, isDefault: true },
        select: { id: true },
      });

      const shouldBeDefault = setDefault || !existingDefault;

      if (shouldBeDefault) {
        await tx.vehicle.updateMany({
          where: { customerId: session.customer.id },
          data: { isDefault: false },
        });
      }

      return tx.vehicle.create({
        data: {
          customerId: session.customer.id,
          year: d.year,
          make: d.make,
          model: d.model,
          color: d.color,
          isDefault: shouldBeDefault,
        },
      });
    });

    revalidatePath("/account");
    revalidatePath("/account/vehicles");
    return { ok: true, id: vehicle.id };
  } catch (err) {
    logger.error("add-customer-vehicle", "db write failed", err);
    return { error: "Could not add vehicle. Try again." };
  }
}

export async function updateCustomerVehicle(
  vehicleId: string,
  _: unknown,
  formData: FormData,
) {
  const session = await requireCustomer();

  const existing = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { id: true, customerId: true },
  });
  if (!existing || existing.customerId !== session.customer.id) {
    return { error: "Vehicle not found." };
  }

  const parsed = vehicleSchema.safeParse({
    year: formData.get("year"),
    make: formData.get("make"),
    model: formData.get("model"),
    color: formData.get("color"),
    isDefault: formData.get("isDefault"),
  });

  if (!parsed.success) {
    const f = parsed.error.flatten().fieldErrors;
    return {
      error: f.year?.[0] ?? f.make?.[0] ?? f.model?.[0] ?? f.color?.[0] ?? "Invalid form",
    };
  }

  const d = parsed.data;
  const setDefault = d.isDefault === "true";

  try {
    await prisma.$transaction(async (tx) => {
      if (setDefault) {
        await tx.vehicle.updateMany({
          where: { customerId: session.customer.id, NOT: { id: vehicleId } },
          data: { isDefault: false },
        });
      }

      await tx.vehicle.update({
        where: { id: vehicleId },
        data: {
          year: d.year,
          make: d.make,
          model: d.model,
          color: d.color,
          ...(setDefault ? { isDefault: true } : {}),
        },
      });
    });

    revalidatePath("/account");
    revalidatePath("/account/vehicles");
    return { ok: true };
  } catch (err) {
    logger.error("update-customer-vehicle", "db write failed", err);
    return { error: "Could not update vehicle. Try again." };
  }
}

export async function deleteCustomerVehicle(vehicleId: string) {
  const session = await requireCustomer();

  const existing = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { id: true, customerId: true, _count: { select: { bookings: true } } },
  });
  if (!existing || existing.customerId !== session.customer.id) {
    return { error: "Vehicle not found." };
  }
  if (existing._count.bookings > 0) {
    return { error: "Remove this vehicle from existing bookings first." };
  }

  try {
    await prisma.vehicle.delete({ where: { id: vehicleId } });
    revalidatePath("/account");
    revalidatePath("/account/vehicles");
    return { ok: true };
  } catch (err) {
    logger.error("delete-customer-vehicle", "db write failed", err);
    return { error: "Could not delete vehicle. Try again." };
  }
}

export async function setDefaultVehicle(vehicleId: string) {
  const session = await requireCustomer();

  const existing = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { id: true, customerId: true },
  });
  if (!existing || existing.customerId !== session.customer.id) {
    return { error: "Vehicle not found." };
  }

  await enforceSingleDefault(session.customer.id, vehicleId);
  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: { isDefault: true },
  });

  revalidatePath("/account");
  revalidatePath("/account/vehicles");
  return { ok: true };
}
