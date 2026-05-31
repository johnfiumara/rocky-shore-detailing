import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const { data: users, error: uErr } = await sb.auth.admin.listUsers();
if (uErr) throw uErr;
const { data: roles, error: rErr } = await sb.from("user_role").select("user_id, role");
if (rErr) throw rErr;

const byId = Object.fromEntries((roles ?? []).map((x) => [x.user_id, x.role]));
for (const u of users.users) {
  console.log(
    `${u.email ?? "(no email)"}  ·  role=${byId[u.id] ?? "none"}  ·  confirmed=${!!u.email_confirmed_at}`,
  );
}
