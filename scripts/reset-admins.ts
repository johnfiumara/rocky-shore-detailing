import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function main() {
  const { data: roleRows, error: rErr } = await sb
    .from("user_role")
    .select("user_id, role")
    .eq("role", "admin");
  if (rErr) throw rErr;

  if (!roleRows || roleRows.length === 0) {
    console.log("No admin role rows found. Nothing to delete.");
    return;
  }

  const { data: list, error: uErr } = await sb.auth.admin.listUsers();
  if (uErr) throw uErr;
  const usersById = Object.fromEntries(list.users.map((u) => [u.id, u]));

  for (const row of roleRows) {
    const u = usersById[row.user_id];
    const label = u?.email ?? `(unknown user ${row.user_id})`;

    const { error: delRoleErr } = await sb
      .from("user_role")
      .delete()
      .eq("user_id", row.user_id);
    if (delRoleErr) {
      console.error(`  · failed to delete user_role for ${label}: ${delRoleErr.message}`);
      continue;
    }
    console.log(`✓ deleted user_role for ${label}`);

    if (u) {
      const { error: delUserErr } = await sb.auth.admin.deleteUser(row.user_id);
      if (delUserErr) {
        console.error(`  · failed to delete auth user ${label}: ${delUserErr.message}`);
        continue;
      }
      console.log(`✓ deleted auth user ${label}`);
    } else {
      console.log(`  · no matching auth user for ${row.user_id} (role row removed only)`);
    }
  }

  const { data: remaining } = await sb
    .from("user_role")
    .select("user_id, role")
    .eq("role", "admin");
  console.log(`\nRemaining admin role rows: ${remaining?.length ?? 0}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
