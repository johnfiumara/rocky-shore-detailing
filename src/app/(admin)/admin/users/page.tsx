"use client";

import { useActionState } from "react";

export default function UsersPage() {
  const [state, formAction, pending] = useActionState(inviteAction, initialState);

  return (
    <div className="p-6 md:p-8 pt-20 md:pt-8 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-display text-bone">Users</h1>

      <div className="border border-line rounded-xl p-4">
        <h2 className="text-bone-dim text-xs uppercase tracking-wider mb-3">Invite User</h2>
        <form action={formAction} className="flex gap-3">
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

      {/* User list will be rendered server-side */}
      <div id="user-list" />
    </div>
  );
}

const initialState = { error: "", success: false };

async function inviteAction(_: unknown, formData: FormData) {
  "use server";
  // This is a placeholder - the actual implementation would be server-side
  const email = formData.get("email") as string;
  const role = formData.get("role") as "admin" | "editor";
  
  if (!email || !role) {
    return { error: "Email and role are required" };
  }
  
  // The actual server-side logic would go here
  // For now, we'll just return a success message
  return { success: true };
}
