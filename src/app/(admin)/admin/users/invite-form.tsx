"use client";

import { useActionState } from "react";
import { inviteUser } from "../actions";

const initialState = { error: "", success: false };

export default function InviteForm() {
  const [state, action, pending] = useActionState(inviteUser, initialState);

  return (
    <div className="border border-line rounded-xl p-4">
      <h2 className="text-bone-dim text-xs uppercase tracking-wider mb-3">Invite User</h2>
      <form action={action} className="flex gap-3">
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="flex-1 bg-ink border border-line rounded-lg px-3 py-2 text-bone text-sm focus:outline-none focus:border-bronze"
        />
        <select
          name="role"
          required
          className="bg-ink border border-line rounded-lg px-3 py-2 text-bone text-sm focus:outline-none focus:border-bronze"
        >
          <option value="editor">Editor</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" disabled={pending} className="btn-primary text-sm disabled:opacity-50">
          {pending ? "Inviting..." : "Invite"}
        </button>
      </form>
      {state?.error && <p className="text-red-400 text-sm mt-2">{state.error}</p>}
      {state?.success && <p className="text-emerald-400 text-sm mt-2">User invited successfully!</p>}
    </div>
  );
}
