"use client";

import { useTransition, useState } from "react";
import { deleteCustomerVehicle } from "../actions";

export function DeleteVehicleButton({ vehicleId }: { vehicleId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () => {
    if (!confirm("Delete this vehicle?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteCustomerVehicle(vehicleId);
      if ("error" in result && result.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={onClick}
        className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
