"use client";

import { useTransition } from "react";
import { deleteExpense } from "../actions";

export default function DeleteExpenseButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => {
        if (!confirm("Delete this expense?")) return;
        start(() => deleteExpense(id));
      }}
      disabled={pending}
      className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
    >
      {pending ? "…" : "Delete"}
    </button>
  );
}
