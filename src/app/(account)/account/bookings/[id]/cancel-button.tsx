"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { cancelMyBooking } from "../../actions";

export default function CancelButton({ bookingId }: { bookingId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function onClick() {
    if (!confirm("Cancel this booking?")) return;
    setError(null);
    startTransition(async () => {
      const result = await cancelMyBooking(bookingId);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
      >
        {pending ? "Cancelling…" : "Cancel this booking"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
