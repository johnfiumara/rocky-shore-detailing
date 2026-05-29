import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  if (!email || !password) {
    console.error("Usage: tsx scripts/provision-admin.ts <email> <password>");
    process.exit(1);
  }

  const supabase = createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  let userId: string;
  if (createErr) {
    if (!/already.*registered/i.test(createErr.message)) {
      console.error("Failed to create user:", createErr.message);
      process.exit(1);
    }
    const { data: list, error: listErr } = await supabase.auth.admin.listUsers();
    if (listErr) {
      console.error("Failed to list users:", listErr.message);
      process.exit(1);
    }
    const existing = list.users.find((u) => u.email === email);
    if (!existing) {
      console.error("User reported as existing but not found in list.");
      process.exit(1);
    }
    userId = existing.id;
  } else {
    userId = created.user.id;
  }

  const { error: roleErr } = await supabase
    .from("user_role")
    .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id" });
  if (roleErr) {
    console.error("Failed to set role:", roleErr.message);
    process.exit(1);
  }

  console.log(`Provisioned admin: ${email} (${userId})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
