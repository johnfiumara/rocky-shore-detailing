"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Forward to the browser console in dev; in prod, Next.js has already
    // logged the full stack server-side under this digest.
    if (process.env.NODE_ENV === "development") {
      console.error("[admin] render error", error);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full border border-line rounded-xl p-8 bg-surface space-y-4">
        <h1 className="text-xl font-display text-bone">Something went wrong</h1>
        <p className="text-bone-dim text-sm">
          We hit an unexpected error rendering this page. Try again, or head back to the dashboard.
        </p>
        {error.digest && (
          <p className="text-xs text-bone-dim/60 font-mono">
            Reference: {error.digest}
          </p>
        )}
        <div className="flex gap-3 pt-2">
          <button
            onClick={reset}
            className="px-4 py-2 text-sm rounded-md bg-bronze text-ink hover:bg-bronze/90 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/admin"
            className="px-4 py-2 text-sm rounded-md border border-line text-bone hover:border-bronze/40 transition-colors"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
