import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { Customer } from "@prisma/client";

export type Role = "admin" | "editor";

export type SessionInfo = {
  userId: string;
  role: Role;
};

export async function getCurrentUser(): Promise<SessionInfo | null> {
  const supabase = await supabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return null;

  const { data: roleRow } = await supabase
    .from("user_role")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!roleRow) return null;
  return { userId: user.id, role: roleRow.role as Role };
}

export async function requireRole(...allowed: Role[]): Promise<SessionInfo> {
  const session = await getCurrentUser();
  if (!session) redirect("/admin/login");
  if (!allowed.includes(session.role)) redirect("/admin");
  return session;
}

export type CustomerSession = {
  userId: string;
  email: string;
  customer: Customer;
};

export async function getCurrentCustomer(): Promise<CustomerSession | null> {
  const supabase = await supabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user?.email) return null;

  // Staff users (admin/editor) are not customers — exit early to avoid
  // accidentally creating a Customer row tied to a staff auth user.
  const { data: roleRow } = await supabase
    .from("user_role")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (roleRow) return null;

  let customer = await prisma.customer.findFirst({
    where: { OR: [{ userId: user.id }, { email: user.email }] },
  });

  if (customer && customer.userId && customer.userId !== user.id) {
    // Email collision with a different already-linked account. Treat as
    // unauthenticated to avoid leaking data.
    return null;
  }

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        userId: user.id,
        email: user.email,
        name: (user.user_metadata?.name as string | undefined) ?? user.email.split("@")[0],
      },
    });
  } else if (!customer.userId) {
    customer = await prisma.customer.update({
      where: { id: customer.id },
      data: { userId: user.id },
    });
  }

  return { userId: user.id, email: user.email, customer };
}

export async function requireCustomer(): Promise<CustomerSession> {
  const session = await getCurrentCustomer();
  if (!session) redirect("/login");
  return session;
}
