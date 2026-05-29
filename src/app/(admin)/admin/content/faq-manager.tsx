"use client";

import { useState, useTransition } from "react";
import {
  createFaqItem,
  deleteFaqItem,
  toggleFaqItemPublished,
  updateFaqItem,
  reorderFaqItems,
} from "../actions";
import { useActionState } from "react";
import { Trash2, Pencil, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react";

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  published: boolean;
  sortOrder: number;
};

const initialState: { error: string } = { error: "" };

export default function FaqManager({
  faqItems,
}: {
  faqItems: FaqItem[];
}) {
  const [state, action, pending] = useActionState(createFaqItem, initialState);
  const [items, setItems] = useState(faqItems);
  const [, start] = useTransition();

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
      reorderFaqItems(updates);
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {items.map((item, idx) => (
          <FaqRow
            key={item.id}
            item={item}
            index={idx}
            total={items.length}
            move={move}
          />
        ))}
      </div>

      <details className="border border-line rounded-xl">
        <summary className="px-4 py-3 text-sm text-bone-dim cursor-pointer hover:text-bone">
          + Add FAQ item
        </summary>
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

function FaqRow({
  item,
  index,
  total,
  move,
}: {
  item: FaqItem;
  index: number;
  total: number;
  move: (i: number, dir: -1 | 1) => void;
}) {
  const [, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [question, setQuestion] = useState(item.question);
  const [answer, setAnswer] = useState(item.answer);
  const [published, setPublished] = useState(item.published);

  const save = () => {
    start(() => updateFaqItem(item.id, { question, answer }));
    setEditing(false);
  };

  const togglePublished = () => {
    const next = !published;
    setPublished(next);
    start(() => toggleFaqItemPublished(item.id, next));
  };

  return (
    <div
      className={`border border-line rounded-xl px-4 py-3 flex gap-3 ${
        !published ? "opacity-50" : ""
      }`}
    >
      {editing ? (
        <div className="flex-1 space-y-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-bone text-sm focus:outline-none focus:border-bronze"
          />
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={3}
            className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-bone text-sm focus:outline-none focus:border-bronze resize-none"
          />
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
            <p className="text-bone text-sm font-medium">{item.question}</p>
            <p className="text-bone-dim text-xs mt-1 line-clamp-2">{item.answer}</p>
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
              onClick={() => start(() => deleteFaqItem(item.id))}
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

