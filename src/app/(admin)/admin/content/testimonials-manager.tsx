"use client";

import { useActionState, useTransition } from "react";
import { createTestimonial, deleteTestimonial, toggleTestimonialPublished } from "../actions";
import { Eye, EyeOff, Trash2 } from "lucide-react";

type Testimonial = { id: string; quote: string; name: string; context: string; published: boolean };

const initialState: { error: string } = { error: "" };

export default function TestimonialsManager({ testimonials }: { testimonials: Testimonial[] }) {
  const [state, action, pending] = useActionState(createTestimonial, initialState);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {testimonials.map((t) => (
          <TestimonialRow key={t.id} testimonial={t} />
        ))}
      </div>

      <details className="border border-line rounded-xl">
        <summary className="px-4 py-3 text-sm text-bone-dim cursor-pointer hover:text-bone">+ Add testimonial</summary>
        <form action={action} className="px-4 pb-4 space-y-3">
          <textarea
            name="quote"
            required
            rows={3}
            placeholder="Quote"
            className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-bone text-sm focus:outline-none focus:border-bronze resize-none"
          />
          <input
            name="name"
            required
            placeholder="Name"
            className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-bone text-sm focus:outline-none focus:border-bronze"
          />
          <input
            name="context"
            required
            placeholder="Context (e.g. Bangor · 2023 F-150)"
            className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-bone text-sm focus:outline-none focus:border-bronze"
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

function TestimonialRow({ testimonial }: { testimonial: Testimonial }) {
  const [, startTransition] = useTransition();

  return (
    <div className={`border border-line rounded-xl px-4 py-3 flex gap-3 ${!testimonial.published ? "opacity-50" : ""}`}>
      <div className="flex-1 min-w-0">
        <p className="text-bone text-sm line-clamp-2">&ldquo;{testimonial.quote}&rdquo;</p>
        <p className="text-bone-dim text-xs mt-1">{testimonial.name} · {testimonial.context}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => startTransition(() => toggleTestimonialPublished(testimonial.id, !testimonial.published))}
          className="p-1.5 text-bone-dim hover:text-bone transition-colors"
          title={testimonial.published ? "Hide" : "Show"}
        >
          {testimonial.published ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
        <button
          onClick={() => startTransition(() => deleteTestimonial(testimonial.id))}
          className="p-1.5 text-bone-dim hover:text-red-400 transition-colors"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
