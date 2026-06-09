export default function AdminLoading() {
  return (
    <div className="p-6 md:p-8 pt-20 md:pt-8 max-w-5xl mx-auto space-y-8 animate-pulse">
      <div className="space-y-3">
        <div className="h-7 w-48 rounded bg-surface" />
        <div className="h-4 w-64 rounded bg-surface/60" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-line bg-surface" />
        ))}
      </div>

      <div className="border border-line rounded-xl overflow-hidden">
        <div className="h-10 bg-surface" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 border-t border-line bg-surface/40" />
        ))}
      </div>
    </div>
  );
}
