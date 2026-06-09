"use client";

import { useActionState } from "react";
import { Button, FormField, Input } from "@/components/ui";
import { updateCustomerProfile } from "../actions";

const initialState = { error: "" };

export function ProfileForm({
  customer,
}: {
  customer: {
    name: string;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    zip?: string | null;
  };
}) {
  const [state, action, pending] = useActionState(
    updateCustomerProfile,
    initialState,
  );

  return (
    <form action={action} className="space-y-6">
      <FormField label="Name" htmlFor="profile-name">
        <Input
          id="profile-name"
          name="name"
          type="text"
          defaultValue={customer.name}
          required
        />
      </FormField>

      <FormField label="Phone" htmlFor="profile-phone">
        <Input
          id="profile-phone"
          name="phone"
          type="tel"
          defaultValue={customer.phone ?? ""}
        />
      </FormField>

      <FormField label="Street address" htmlFor="profile-address">
        <Input
          id="profile-address"
          name="address"
          type="text"
          defaultValue={customer.address ?? ""}
        />
      </FormField>

      <div className="grid gap-5 md:grid-cols-2">
        <FormField label="City" htmlFor="profile-city">
          <Input
            id="profile-city"
            name="city"
            type="text"
            defaultValue={customer.city ?? ""}
          />
        </FormField>
        <FormField label="ZIP" htmlFor="profile-zip">
          <Input
            id="profile-zip"
            name="zip"
            type="text"
            inputMode="numeric"
            maxLength={5}
            defaultValue={customer.zip ?? ""}
          />
        </FormField>
      </div>

      {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}
      {state?.ok && <p className="text-emerald-400 text-sm">Profile saved.</p>}

      <Button type="submit" variant="primary" isLoading={pending}>
        Save profile
      </Button>
    </form>
  );
}
