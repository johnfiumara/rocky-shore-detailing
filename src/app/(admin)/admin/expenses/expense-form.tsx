"use client";

import { useActionState, useEffect, useRef } from "react";
import { createExpense } from "../actions";

const initialState: { error?: string; ok?: boolean } = {};

const CATEGORIES = [
  "Supplies",
  "Fuel",
  "Equipment",
  "Tools",
  "Marketing",
  "Insurance",
  "Vehicle",
  "Software",
  "Other",
];

const fieldBase =
  "w-full bg-ink border border-line rounded-lg px-3 py-2 text-bone text-sm focus:outline-none focus:border-bronze";
const labelBase = "text-bone-dim text-xs uppercase tracking-wider block mb-1.5";

export default function ExpenseForm() {
  const [state, action, pending] = useActionState(createExpense, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form ref={formRef} action={action} className="border border-line rounded-xl p-5 space-y-4">
      <h2 className="text-bone text-sm font-mono-accent tracking-widest uppercase">Add expense</h2>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className={labelBase} htmlFor="date">Date</label>
          <input id="date" name="date" type="date" defaultValue={today} required className={fieldBase} />
        </div>
        <div>
          <label className={labelBase} htmlFor="category">Category</label>
          <input id="category" name="category" list="expense-categories" required className={fieldBase} />
          <datalist id="expense-categories">
            {CATEGORIES.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>
        <div>
          <label className={labelBase} htmlFor="amount">Amount ($)</label>
          <input id="amount" name="amount" type="number" min="0.01" step="0.01" required className={fieldBase} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelBase} htmlFor="description">Description</label>
          <input id="description" name="description" required placeholder="e.g. Microfiber towels" className={fieldBase} />
        </div>
        <div>
          <label className={labelBase} htmlFor="vendor">Vendor</label>
          <input id="vendor" name="vendor" placeholder="e.g. Chemical Guys" className={fieldBase} />
        </div>
      </div>

      <div>
        <label className={labelBase} htmlFor="notes">Notes</label>
        <textarea id="notes" name="notes" rows={2} className={`${fieldBase} resize-none`} />
      </div>

      {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}
      {state?.ok && <p className="text-emerald-400 text-sm">Expense added.</p>}

      <button type="submit" disabled={pending} className="btn-primary text-sm disabled:opacity-50">
        {pending ? "Saving…" : "Add expense"}
      </button>
    </form>
  );
}
