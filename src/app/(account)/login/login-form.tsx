"use client";

import { useActionState } from "react";
import { customerLogin } from "../account/actions";
import { Button, FormField, Input } from "@/components/ui";

const initialState = { error: "" };

export default function LoginForm() {
  const [state, action, pending] = useActionState(customerLogin, initialState);

  return (
    <form action={action} className="space-y-4">
      <FormField label="Email" error={state?.error} htmlFor="email">
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
