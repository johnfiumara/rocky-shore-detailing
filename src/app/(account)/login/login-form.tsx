"use client";

import { useActionState } from "react";
import { customerLogin } from "../account/actions";

const initialState = { error: "" };

export default function LoginForm() {
  const [state, action, pending] = useActionState(customerLogin, initialState);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm text-bone-dim mb-1.5">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full bg-surface border border-line rounded-lg px-4 py-2.5 text-bone text-sm focus:outline-none focus:border-bronze"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm text-bone-dim mb-1.5">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full bg-surface border border-line rounded-lg px-4 py-2.5 text-bone text-sm focus:outline-none focus:border-bronze"
        />
      </div>

      {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full btn-primary disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
