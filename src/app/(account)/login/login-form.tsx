"use client";

import { useActionState } from "react";
import { customerLogin } from "../account/actions";
import { Button, FormField, Input } from "@/components/ui";

const initialState = { error: "" };

export default function LoginForm() {
  const [state, action, pending] = useActionState(customerLogin, initialState);

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <p className="text-red-400 text-sm">{state.error}</p>
      )}
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
          autoComplete="current-password"
          required
        />
      </FormField>

      <Button type="submit" variant="primary" isLoading={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
