"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { createCustomerMessage, deleteCustomerMessage } from "../../actions";

type Message = {
  id: string;
  channel: string;
  direction: string;
  body: string;
  createdAt: Date | string;
};

const initialState: { error?: string; ok?: boolean } = {};

const CHANNEL_LABEL: Record<string, string> = {
  phone: "Phone",
  text: "Text",
  email: "Email",
  "in-person": "In-person",
  other: "Other",
};

const DIRECTION_LABEL: Record<string, string> = {
  inbound: "From customer",
  outbound: "To customer",
  internal: "Internal note",
};

const DIRECTION_ACCENT: Record<string, string> = {
  inbound: "bg-blue-400/10 text-blue-400",
  outbound: "bg-emerald-400/10 text-emerald-400",
  internal: "bg-bone/10 text-bone-dim",
};

function formatTimestamp(d: Date | string) {
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MessageThread({
  customerId,
  messages,
}: {
  customerId: string;
  messages: Message[];
}) {
  const [state, action, pending] = useActionState(createCustomerMessage, initialState);
  const [deletePending, startDelete] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div className="space-y-4">
      <div className="border border-line rounded-xl overflow-hidden">
        {messages.length === 0 ? (
          <p className="text-bone-dim text-sm p-4">No messages yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {messages.map((m) => (
              <li key={m.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${DIRECTION_ACCENT[m.direction] ?? "bg-line text-bone-dim"}`}>
                      {DIRECTION_LABEL[m.direction] ?? m.direction}
                    </span>
                    <span className="text-bone-dim text-xs">{CHANNEL_LABEL[m.channel] ?? m.channel}</span>
                    <span className="text-bone-dim text-xs">·</span>
                    <span className="text-bone-dim text-xs">{formatTimestamp(m.createdAt)}</span>
                  </div>
                  <button
                    onClick={() => {
                      if (!confirm("Delete this message?")) return;
                      startDelete(() => deleteCustomerMessage(m.id, customerId));
                    }}
                    disabled={deletePending}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
                <p className="text-bone text-sm whitespace-pre-wrap">{m.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form ref={formRef} action={action} className="border border-line rounded-xl p-4 space-y-3">
        <input type="hidden" name="customerId" value={customerId} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="direction" className="text-bone-dim text-xs uppercase tracking-wider block mb-1.5">
              Direction
            </label>
            <select
              id="direction"
              name="direction"
              defaultValue="outbound"
              className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-bone text-sm focus:outline-none focus:border-bronze"
            >
              <option value="outbound">To customer</option>
              <option value="inbound">From customer</option>
              <option value="internal">Internal note</option>
            </select>
          </div>
          <div>
            <label htmlFor="channel" className="text-bone-dim text-xs uppercase tracking-wider block mb-1.5">
              Channel
            </label>
            <select
              id="channel"
              name="channel"
              defaultValue="phone"
              className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-bone text-sm focus:outline-none focus:border-bronze"
            >
              <option value="phone">Phone</option>
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="in-person">In-person</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="body" className="text-bone-dim text-xs uppercase tracking-wider block mb-1.5">
            Message
          </label>
          <textarea
            id="body"
            name="body"
            rows={3}
            required
            placeholder="Log what was said, or jot an internal note…"
            className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-bone text-sm focus:outline-none focus:border-bronze resize-none"
          />
        </div>

        {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}

        <button type="submit" disabled={pending} className="btn-primary text-sm disabled:opacity-50">
          {pending ? "Saving…" : "Log message"}
        </button>
      </form>
    </div>
  );
}
