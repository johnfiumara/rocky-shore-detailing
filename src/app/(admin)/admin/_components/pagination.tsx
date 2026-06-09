import Link from "next/link";

type Props = {
  basePath: string;
  page: number;
  pageSize: number;
  total: number;
  /** Extra search params to preserve on page links (e.g. status filter). */
  preserve?: Record<string, string | undefined>;
};

export function Pagination({ basePath, page, pageSize, total, preserve }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const build = (p: number) => {
    const params = new URLSearchParams();
    if (preserve) {
      for (const [k, v] of Object.entries(preserve)) {
        if (v) params.set(k, v);
      }
    }
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between text-xs text-bone-dim">
      <p>
        Showing {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-2">
        {prevDisabled ? (
          <span className="px-3 py-1.5 rounded-md border border-line/50 text-bone-dim/40">Prev</span>
        ) : (
          <Link
            href={build(page - 1)}
            className="px-3 py-1.5 rounded-md border border-line text-bone hover:border-bronze/40"
          >
            Prev
          </Link>
        )}
        <span className="px-2">
          Page {page} / {totalPages}
        </span>
        {nextDisabled ? (
          <span className="px-3 py-1.5 rounded-md border border-line/50 text-bone-dim/40">Next</span>
        ) : (
          <Link
            href={build(page + 1)}
            className="px-3 py-1.5 rounded-md border border-line text-bone hover:border-bronze/40"
          >
            Next
          </Link>
        )}
      </div>
    </div>
  );
}

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export function parsePageParams(input: { page?: string; pageSize?: string }) {
  const page = Math.max(1, Number.parseInt(input.page ?? "1", 10) || 1);
  const requested = Number.parseInt(input.pageSize ?? "", 10);
  const pageSize =
    Number.isFinite(requested) && requested > 0
      ? Math.min(requested, MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}
