"use client";

import { useActionState } from "react";
import { customerSignup } from "../account/actions";
import { Button, FormField, Input } from "@/components/ui";

const initialState = { error: "" };

export default function SignupForm() {
  const [state, action, pending] = useActionState(customerSignup, initialState);

  return (
    <form action={action} className="space-y-4">
      <FormField label="Name" htmlFor="name">
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
        />
      </FormField>
      <FormField label="Email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </FormField>
      <FormField label="Password" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </FormField>
      <p className="text-xs text-bone-dim">Minimum 8 characters.</p>

      {state?.error && (
        <p className="text-red-400 text-sm">{state.error}</p>
      )}

      <Button type="submit" variant="primary" isLoading={pending} className="w-full">
        {pending ? "Creating…" : "Create account"}
      </Button>
    </form>
  );
}
