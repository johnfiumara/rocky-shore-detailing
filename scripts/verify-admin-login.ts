import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  if (!email || !password) {
    console.error("Usage: tsx scripts/verify-admin-login.ts <email> <password>");
    process.exit(1);
  }

  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: signIn, error: signErr } = await anon.auth.signInWithPassword({
    email,
    password,
  });
  if (signErr) {
    console.error(`✗ signInWithPassword failed: ${signErr.message}`);
    process.exit(1);
  }
  console.log(`✓ signed in as ${signIn.user?.email} (id=${signIn.user?.id})`);

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { data: role, error: roleErr } = await admin
    .from("user_role")
    .select("role")
    .eq("user_id", signIn.user!.id)
    .single();
  if (roleErr) {
    console.error(`✗ role lookup failed: ${roleErr.message}`);
    process.exit(1);
  }
  console.log(`✓ role=${role.role}`);
  if (role.role !== "admin") {
    console.error("✗ user is not admin");
    process.exit(1);
  }
  console.log("✓ admin verified end-to-end");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
