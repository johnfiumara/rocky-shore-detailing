import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full border border-line rounded-xl p-8 bg-surface text-center space-y-4">
        <p className="text-xs font-mono tracking-widest uppercase text-bone-dim">404</p>
        <h1 className="text-xl font-display text-bone">Page not found</h1>
        <p className="text-bone-dim text-sm">
          The admin page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/admin"
          className="inline-block px-4 py-2 text-sm rounded-md bg-bronze text-ink hover:bg-bronze/90 transition-colors"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
