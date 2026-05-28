"use client";

import { useActionState, useTransition } from "react";
import { createFaqItem, deleteFaqItem } from "../actions";
import { Trash2 } from "lucide-react";

type FaqItem = { id: string; question: string; answer: string; published: boolean };

const initialState: { error: string } = { error: "" };

export default function FaqManager({ faqItems }: { faqItems: FaqItem[] }) {
  const [state, action, pending] = useActionState(createFaqItem, initialState);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {faqItems.map((item) => (
          <FaqRow key={item.id} item={item} />
        ))}
      </div>

      <details className="border border-line rounded-xl">
        <summary className="px-4 py-3 text-sm text-bone-dim cursor-pointer hover:text-bone">+ Add FAQ item</summary>
        <form action={action} className="px-4 pb-4 space-y-3">
          <input
            name="question"
            required
            placeholder="Question"
            className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-bone text-sm focus:outline-none focus:border-bronze"
          />
          <textarea
            name="answer"
            required
            rows={3}
            placeholder="Answer"
            className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-bone text-sm focus:outline-none focus:border-bronze resize-none"
          />
          {state?.error && <p className="text-red-400 text-xs">{state.error}</p>}
          <button type="submit" disabled={pending} className="btn-primary text-sm disabled:opacity-50">
            {pending ? "Adding…" : "Add"}
          </button>
        </form>
      </details>
    </div>
  );
}

function FaqRow({ item }: { item: FaqItem }) {
  const [, startTransition] = useTransition();

  return (
    <div className="border border-line rounded-xl px-4 py-3 flex gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-bone text-sm font-medium">{item.question}</p>
        <p className="text-bone-dim text-xs mt-1 line-clamp-2">{item.answer}</p>
      </div>
      <button
        onClick={() => startTransition(() => deleteFaqItem(item.id))}
        className="p-1.5 text-bone-dim hover:text-red-400 transition-colors shrink-0"
        title="Delete"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
