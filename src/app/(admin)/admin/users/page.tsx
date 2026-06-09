import { requireRole } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import InviteForm from "./invite-form";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  await requireRole("admin");

  const admin = supabaseAdmin();

  const [{ data: usersData }, { data: roles }] = await Promise.all([
    admin.auth.admin.listUsers(),
    supabaseServer().then((sb) => sb.from("user_role").select("user_id, role")),
  ]);

  const roleById = Object.fromEntries(roles?.map((r) => [r.user_id, r.role]) ?? []);
  const users = (usersData?.users ?? []).map((u) => ({
    id: u.id,
    email: u.email ?? "—",
    role: roleById[u.id] ?? "none",
  }));

  async function revoke(userId: string) {
    "use server";
    await requireRole("admin");
    await supabaseAdmin().from("user_role").delete().eq("user_id", userId);
    revalidatePath("/admin/users");
  }

  return (
    <div className="p-6 md:p-8 pt-20 md:pt-8 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-display text-bone">Users</h1>

      <InviteForm />

      <div className="border border-line rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="px-4 py-3 text-bone-dim font-normal text-xs uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-bone-dim font-normal text-xs uppercase tracking-wider">Role</th>
              <th className="px-4 py-3 text-bone-dim font-normal text-xs uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 text-bone">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                    u.role === "admin" ? "bg-bronze/10 text-bronze" :
                    u.role === "editor" ? "bg-emerald-400/10 text-emerald-400" :
                    "bg-line text-bone-dim"
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.role !== "none" && (
                    <form action={revoke.bind(null, u.id)}>
                      <button
                        type="submit"
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Revoke
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
