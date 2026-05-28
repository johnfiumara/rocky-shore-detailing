"use client";

import { useOptimistic, useTransition, useState } from "react";
import { BookingStatus } from "@prisma/client";
import { updateBookingStatus, updateBookingAdminNotes, updateBookingPrice } from "../../actions";

type Booking = {
  id: string;
  status: BookingStatus;
  adminNotes: string | null;
  price: number | null;
};

const STATUS_OPTIONS: BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default function BookingActions({ booking }: { booking: Booking }) {
  const [, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(booking.status);
  const [notes, setNotes] = useState(booking.adminNotes ?? "");
  const [price, setPrice] = useState(booking.price?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  const changeStatus = (status: BookingStatus) => {
    startTransition(async () => {
      setOptimisticStatus(status);
      await updateBookingStatus(booking.id, status);
    });
  };

  const saveNotes = async () => {
    setSaving(true);
    await updateBookingAdminNotes(booking.id, notes);
    setSaving(false);
  };

  const savePrice = async () => {
    const parsed = parseFloat(price);
    if (!isNaN(parsed)) await updateBookingPrice(booking.id, parsed);
  };

  return (
    <div className="space-y-6 w-full">
      {/* Status selector */}
      <div>
        <p className="text-bone-dim text-xs uppercase tracking-wider mb-2">Status</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => changeStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                optimisticStatus === s
                  ? "border-bronze text-bronze bg-bronze/10"
                  : "border-line text-bone-dim hover:border-bone/40"
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <p className="text-bone-dim text-xs uppercase tracking-wider mb-2">Price ($)</p>
        <div className="flex gap-2">
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g. 200"
            className="bg-surface border border-line rounded-lg px-3 py-2 text-bone text-sm focus:outline-none focus:border-bronze w-32"
          />
          <button onClick={savePrice} className="btn-primary text-xs px-4">Save</button>
        </div>
      </div>

      {/* Admin notes */}
      <div>
        <p className="text-bone-dim text-xs uppercase tracking-wider mb-2">Admin Notes</p>
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-bone text-sm focus:outline-none focus:border-bronze resize-none"
        />
        <button
          onClick={saveNotes}
          disabled={saving}
          className="mt-2 btn-primary text-xs px-4 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Notes"}
        </button>
      </div>
    </div>
  );
}
