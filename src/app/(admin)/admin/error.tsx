"use client";

// TEMPORARY DEBUG: surface server errors to the browser so we can diagnose
// the prod 500 without function-log access. Delete after the deploy bug
// is fixed.
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ padding: 24, fontFamily: "monospace", color: "#fca5a5" }}>
      <h1 style={{ fontSize: 18, marginBottom: 12 }}>Admin error (debug)</h1>
      <p><strong>message:</strong> {error.message}</p>
      <p><strong>digest:</strong> {error.digest ?? "(none)"}</p>
      <p><strong>name:</strong> {error.name}</p>
      <pre style={{ whiteSpace: "pre-wrap", marginTop: 12, color: "#fda4af" }}>
        {error.stack ?? "(no stack)"}
      </pre>
      <button
        onClick={reset}
        style={{ marginTop: 16, padding: "6px 12px", background: "#444", color: "#fff", borderRadius: 4 }}
      >
        retry
      </button>
    </div>
  );
}
