import { supabaseAnon } from "@/lib/supabase/server";

const now = () => new Date().toISOString();

export type PublishedListQuery = {
  /** Log scope tag, e.g. "faq" renders as "[cms:faq] ...". */
  scope: string;
  /** Human noun used in log messages, e.g. "FAQ items". */
  noun: string;
  /** Supabase table name. */
  table: string;
  /** Column selection string passed to `.select()`. */
  columns: string;
  /** Boolean flag column to filter on (defaults to "published"). */
  flag?: string;
  /** Column to order by (defaults to "sortOrder"). */
  orderBy?: string;
  /** Overrides the derived "Failed to fetch <noun>" error message. */
  errorMessage?: string;
};

/**
 * Runs the shared "read a published, ordered list" query used by every CMS
 * module. Returns the rows on success, or `null` when the caller should fall
 * back to its bundled static data. Every failure mode — Supabase error, empty
 * result, or a thrown exception — is logged here and collapses to `null`, so
 * callers only need `?? staticFallback`.
 */
export async function fetchPublishedRows<T>({
  scope,
  noun,
  table,
  columns,
  flag = "published",
  orderBy = "sortOrder",
  errorMessage,
}: PublishedListQuery): Promise<T[] | null> {
  try {
    const { data, error } = await supabaseAnon()
      .from(table)
      .select(columns)
      .eq(flag, true)
      .order(orderBy);

    if (error || !data || data.length === 0) {
      console.warn(`[cms:${scope}] No ${noun} found, using static fallback`, {
        error: error?.message,
        timestamp: now(),
      });
      return null;
    }

    return data as T[];
  } catch (err) {
    console.error(errorMessage ?? `[cms:${scope}] Failed to fetch ${noun}`, {
      error: err instanceof Error ? err.message : String(err),
      timestamp: now(),
    });
    return null;
  }
}
