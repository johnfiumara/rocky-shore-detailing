"use client";

import { useTransition } from "react";
import { setDefaultVehicle } from "../actions";

export function SetDefaultButton({ vehicleId }: { vehicleId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => { await setDefaultVehicle(vehicleId); })}
      className="text-xs text-bronze hover:text-bronze-glow transition-colors disabled:opacity-50"
    >
      {pending ? "Saving…" : "Set as default"}
    </button>
  );
}
