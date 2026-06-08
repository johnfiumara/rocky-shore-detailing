"use client";

import { useActionState } from "react";
import { Button, FormField, Input } from "@/components/ui";
import { addCustomerVehicle } from "../actions";

const initialState = { error: "" };

export function VehicleForm() {
  const [state, action, pending] = useActionState(addCustomerVehicle, initialState);

  return (
    <form action={action} className="space-y-5 border border-line rounded-xl p-5">
      <h3 className="font-display text-lg text-bone">Add a vehicle</h3>
      <div className="grid gap-5 md:grid-cols-4">
        <FormField label="Year" htmlFor="vehicle-year">
          <Input
            id="vehicle-year"
            name="year"
            type="number"
            inputMode="numeric"
            placeholder="2021"
            required
          />
        </FormField>
        <FormField label="Make" htmlFor="vehicle-make">
          <Input
            id="vehicle-make"
            name="make"
            type="text"
            placeholder="Subaru"
            required
          />
        </FormField>
        <FormField label="Model" htmlFor="vehicle-model">
          <Input
            id="vehicle-model"
            name="model"
            type="text"
            placeholder="Outback"
            required
          />
        </FormField>
        <FormField label="Color" htmlFor="vehicle-color">
          <Input
            id="vehicle-color"
            name="color"
            type="text"
            placeholder="Magnetite Gray"
            required
          />
        </FormField>
      </div>

      <label className="flex items-center gap-2 text-sm text-bone">
        <input
          type="checkbox"
          name="isDefault"
          value="true"
          className="accent-bronze"
        />
        Make this my default vehicle
      </label>

      {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}
      {state?.ok && <p className="text-emerald-400 text-sm">Vehicle added.</p>}

      <Button type="submit" variant="primary" isLoading={pending}>
        Add vehicle
      </Button>
    </form>
  );
}
