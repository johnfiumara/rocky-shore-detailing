"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createTestimonial,
  deleteTestimonial,
  toggleTestimonialPublished,
  updateTestimonial,
  reorderTestimonials,
} from "../actions";
import { useActionState } from "react";
import { Eye, EyeOff, Trash2, Pencil, ArrowUp, ArrowDown } from "lucide-react";

type Testimonial = {
  id: string;
  quote: string;
  name: string;
  context: string;
  published: boolean;
  sortOrder: number;
};

type TestimonialActionState = { error: string } | { ok: true };
const initialState: TestimonialActionState = { error: "" };

export default function TestimonialsManager({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  const [state, action, pending] = useActionState(createTestimonial, initialState);
  const [items, setItems] = useState(testimonials);
  const [dismissedState, setDismissedState] = useState<TestimonialActionState | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [, start] = useTransition();

  const success =
    !!state && "ok" in state && state.ok && dismissedState !== state;

  useEffect(() => {
    if (state && "ok" in state && state.ok && dismissedState !== state) {
      const captured = state as TestimonialActionState;
      formRef.current?.reset();
      router.refresh();
      const timer = setTimeout(() => setDismissedState(captured), 3000);
      return () => clearTimeout(timer);
    }
  }, [state, router, dismissedState]);

  const move = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= items.length) return;
    const copy = [...items];
    const tmp = copy[index];
    copy[index] = copy[next];
    copy[next] = tmp;
    setItems(copy);
    start(() => {
      const updates = copy.map((i, idx) => ({ id: i.id, sortOrder: idx }));
      reorderTestimonials(updates);
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {items.map((t, idx) => (
          <TestimonialRow
            key={t.id}
            testimonial={t}
            index={idx}
            total={items.length}
            move={move}
          />
        ))}
      </div>

      <details className="border border-line rounded-xl">
        <summary className="px-4 py-3 text-sm text-bone-dim cursor-pointer hover:text-bone">
          + Add testimonial
        </summary>
        <form ref={formRef} action={action} className="px-4 pb-4 space-y-3">
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
          {success && <p className="text-green-400 text-xs">Testimonial added.</p>}
          <button type="submit" disabled={pending} className="btn-primary text-sm disabled:opacity-50">
            {pending ? "Adding…" : "Add"}
          </button>
        </form>
      </details>
    </div>
  );
}

function TestimonialRow({
  testimonial,
  index,
  total,
  move,
}: {
  testimonial: Testimonial;
  index: number;
  total: number;
  move: (i: number, dir: -1 | 1) => void;
}) {
  const [, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [quote, setQuote] = useState(testimonial.quote);
  const [name, setName] = useState(testimonial.name);
  const [context, setContext] = useState(testimonial.context);
  const [published, setPublished] = useState(testimonial.published);

  const save = () => {
    start(() =>
      updateTestimonial(testimonial.id, { quote, name, context })
    );
    setEditing(false);
  };

  const togglePublished = () => {
    const next = !published;
    setPublished(next);
    start(() => toggleTestimonialPublished(testimonial.id, next));
  };

  return (
    <div
      className={`border border-line rounded-xl px-4 py-3 flex gap-3 ${
        !published ? "opacity-50" : ""
      }`}
    >
      {editing ? (
        <div className="flex-1 space-y-2">
          <textarea
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            rows={2}
            className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-bone text-sm focus:outline-none focus:border-bronze resize-none"
          />
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 bg-surface border border-line rounded-lg px-3 py-2 text-bone text-sm focus:outline-none focus:border-bronze"
            />
            <input
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="flex-1 bg-surface border border-line rounded-lg px-3 py-2 text-bone text-sm focus:outline-none focus:border-bronze"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={save}
              className="bg-bronze/20 hover:bg-bronze/30 text-bronze text-xs px-3 py-1.5 rounded transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="bg-line text-bone-dim hover:text-bone text-xs px-3 py-1.5 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <p className="text-bone text-sm line-clamp-2">
              &ldquo;{testimonial.quote}&rdquo;
            </p>
            <p className="text-bone-dim text-xs mt-1">
              {testimonial.name} · {testimonial.context}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => move(index, -1)}
              disabled={index === 0}
              className="p-1.5 text-bone-dim hover:text-bone transition-colors disabled:opacity-30"
              title="Move up"
            >
              <ArrowUp size={14} />
            </button>
            <button
              onClick={() => move(index, 1)}
              disabled={index === total - 1}
              className="p-1.5 text-bone-dim hover:text-bone transition-colors disabled:opacity-30"
              title="Move down"
            >
              <ArrowDown size={14} />
            </button>
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 text-bone-dim hover:text-bone transition-colors"
              title="Edit"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={togglePublished}
              className="p-1.5 text-bone-dim hover:text-bone transition-colors"
              title={published ? "Hide" : "Show"}
            >
              {published ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
            <button
              onClick={() => start(() => deleteTestimonial(testimonial.id))}
              className="p-1.5 text-bone-dim hover:text-red-400 transition-colors"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

