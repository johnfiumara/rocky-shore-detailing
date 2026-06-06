/**
 * Pre-deploy verification: confirm the public marketing site can actually
 * read CMS content via the Supabase anon key.
 *
 * This is the missing diagnostic that would have caught the multi-day
 * "CMS not updating" incident. Prisma writes succeed against DATABASE_URL
 * (owner role, bypasses RLS) but supabaseAnon() reads return zero rows
 * when no SELECT policy exists for the anon role — and the helpers in
 * src/lib/cms/*.ts silently fall back to hardcoded src/data/*.ts.
 *
 * This script uses the anon key on purpose. Running with service_role
 * would defeat the test.
 *
 * Usage:
 *   npx tsx scripts/verify-public-reads.ts
 *
 * To target prod from a local shell:
 *   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
 *     npx tsx scripts/verify-public-reads.ts
 *
 * Exit code: 0 on success, 1 if any table returned zero rows or an error.
 */

import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env.local" });

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Check = {
  table: string;
  select: string;
  filter?: { column: string; value: unknown };
  note: string;
};

const CHECKS: Check[] = [
  {
    table: "Service",
    select: "id, tiers:ServiceTier(id)",
    filter: { column: "active", value: true },
    note: "Home page services grid + embedded ServiceTier",
  },
  {
    table: "Testimonial",
    select: "id",
    filter: { column: "published", value: true },
    note: "Testimonials marquee",
  },
  {
    table: "FaqItem",
    select: "id",
    filter: { column: "published", value: true },
    note: "FAQ section",
  },
  {
    table: "GalleryImage",
    select: "id, isBefore, isAfter",
    filter: { column: "published", value: true },
    note: "Gallery + before/after pair",
  },
  {
    table: "site_setting",
    select: "key",
    note: "Footer contact + hero copy",
  },
];

type Result =
  | { ok: true; table: string; rows: number; embedded?: number; note: string }
  | { ok: false; table: string; reason: string; note: string };

async function runCheck(client: SupabaseClient, check: Check): Promise<Result> {
  try {
    let query = client.from(check.table).select(check.select);
    if (check.filter) {
      query = query.eq(check.filter.column, check.filter.value);
    }
    const { data, error } = await query;

    if (error) {
      return {
        ok: false,
        table: check.table,
        reason: `anon read returned an error: ${error.message}`,
        note: check.note,
      };
    }

    const rows = data?.length ?? 0;
    if (rows === 0) {
      return {
        ok: false,
        table: check.table,
        reason:
          "anon read returned 0 rows. Likely a missing RLS policy " +
          "(supabase/migrations/*.sql) or an empty table in this Supabase project.",
        note: check.note,
      };
    }

    // Supabase typings widen `data` when the select string is dynamic; cast
    // through unknown so we can treat rows as plain records.
    const rowsAsRecords = data as unknown as Array<Record<string, unknown>>;

    // Count embedded relations if the select string requested them.
    let embedded: number | undefined;
    if (check.select.includes(":")) {
      embedded = rowsAsRecords.reduce((sum, row) => {
        const child = Object.values(row).find((v) => Array.isArray(v));
        return sum + (Array.isArray(child) ? child.length : 0);
      }, 0);
    }

    // GalleryImage has a separate helper (getBeforeAfterPair) that falls back
    // to static if there isn't at least one isBefore=true and one isAfter=true.
    // Row count alone isn't sufficient — check both flags.
    if (check.table === "GalleryImage") {
      const rowsArr = data as unknown as Array<{ isBefore?: boolean; isAfter?: boolean }>;
      const beforeCount = rowsArr.filter((r) => r.isBefore === true).length;
      const afterCount = rowsArr.filter((r) => r.isAfter === true).length;
      if (beforeCount === 0 || afterCount === 0) {
        return {
          ok: false,
          table: check.table,
          reason:
            `published rows OK (${rows}) but isBefore=${beforeCount}, isAfter=${afterCount}. ` +
            "getBeforeAfterPair() falls back to src/data/gallery.ts when either is 0. " +
            "Mark one published GalleryImage isBefore=true and one isAfter=true from /admin/gallery.",
          note: check.note,
        };
      }
    }

    return { ok: true, table: check.table, rows, embedded, note: check.note };
  } catch (err) {
    return {
      ok: false,
      table: check.table,
      reason: `threw: ${err instanceof Error ? err.message : String(err)}`,
      note: check.note,
    };
  }
}

function format(result: Result): string {
  const table = result.table.padEnd(16);
  if (result.ok) {
    const main = `${result.rows.toString().padStart(4)} rows`;
    const embed =
      result.embedded !== undefined ? ` (+${result.embedded} embedded)` : "";
    return `[ok]   ${table} ${main}${embed}  — ${result.note}`;
  }
  return `[FAIL] ${table} ${result.reason}\n         (${result.note})`;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error(
      "[verify-public-reads] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set.\n" +
        "  Populate .env.local, or pass them inline:\n" +
        "    NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... npx tsx scripts/verify-public-reads.ts",
    );
    process.exit(1);
  }

  console.log(`[verify-public-reads] target: ${url}`);
  console.log("");

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const results = await Promise.all(CHECKS.map((c) => runCheck(client, c)));

  for (const r of results) {
    console.log(format(r));
  }

  const failed = results.filter((r) => !r.ok);
  console.log("");

  if (failed.length === 0) {
    console.log(`[verify-public-reads] OK — all ${results.length} public reads succeeded.`);
    process.exit(0);
  }

  console.error(
    `[verify-public-reads] FAIL — ${failed.length}/${results.length} public reads broken.\n` +
      "  The live site will serve hardcoded fallback data from src/data/*.ts.\n" +
      "  DO NOT DEPLOY until this is resolved. See .claude/skills/add-cms-table-rls/SKILL.md.",
  );
  process.exit(1);
}

main().catch((err) => {
  console.error("[verify-public-reads] threw:", err);
  process.exit(1);
});
