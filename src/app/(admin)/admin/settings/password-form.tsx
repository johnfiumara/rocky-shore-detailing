"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePassword } from "../actions";

const initialState: { error?: string; ok?: boolean } = {};

export default function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="border border-line rounded-xl p-4 space-y-3">
      <div>
        <label htmlFor="password" className="text-bone-dim text-xs uppercase tracking-wider block mb-1.5">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-bone text-sm focus:outline-none focus:border-bronze"
        />
      </div>
      <div>
        <label htmlFor="confirm" className="text-bone-dim text-xs uppercase tracking-wider block mb-1.5">
          Confirm new password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-bone text-sm focus:outline-none focus:border-bronze"
        />
      </div>

      {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}
      {state?.ok && <p className="text-emerald-400 text-sm">Password updated.</p>}

      <button type="submit" disabled={pending} className="btn-primary text-sm disabled:opacity-50">
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
