"use client";

import { Star } from "lucide-react";
import { RadioCard } from "@/components/ui";
import { FieldError } from "@/components/ui";
import type { VehicleSummary } from "./types";

export function VehicleSelect({
  vehicles,
  selectedId,
  onSelect,
  error,
}: {
  vehicles: VehicleSummary[];
  selectedId: string | "new";
  onSelect: (id: string | "new") => void;
  error?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        {vehicles.map((v) => (
          <RadioCard
            key={v.id}
            name="vehicleChoice"
            value={v.id}
            checked={selectedId === v.id}
            onChange={() => onSelect(v.id)}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-display text-lg text-bone">
                {v.year} {v.make} {v.model}
              </span>
              {v.isDefault && (
                <span className="inline-flex items-center gap-1 text-[10px] tracking-wider uppercase text-bronze">
                  <Star size={10} /> Default
                </span>
              )}
            </div>
            <div className="text-bone-dim text-sm mt-1">{v.color}</div>
          </RadioCard>
        ))}

        <RadioCard
          name="vehicleChoice"
          value="new"
          checked={selectedId === "new"}
          onChange={() => onSelect("new")}
        >
          <div className="font-display text-lg text-bone">Different vehicle</div>
          <div className="text-bone-dim text-sm mt-1">
            Add year, make, model, and color
          </div>
        </RadioCard>
      </div>
      <FieldError msg={error} />
    </div>
  );
}
