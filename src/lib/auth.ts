import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

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
