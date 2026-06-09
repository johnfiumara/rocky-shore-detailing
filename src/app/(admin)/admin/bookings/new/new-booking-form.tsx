"use client";

import { useActionState } from "react";
import { createManualBooking } from "../../actions";
import { SERVICE_SLUGS, TIME_WINDOWS, TIME_WINDOW_LABELS } from "@/lib/booking-schema";

const initialState: { error?: string; fieldErrors?: Record<string, string[] | undefined> } = {};

const SERVICE_LABELS: Record<(typeof SERVICE_SLUGS)[number], string> = {
  "full-package": "Interior, Exterior, Tires & Trunk",
  "interior-exterior": "Interior & Exterior",
  "interior-tires": "Interior & Tires",
  "exterior-tires": "Exterior & Tires",
  "interior-restoration": "Interior Restoration",
  refresh: "Refresh",
};

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-red-400 text-xs mt-1">{msg}</p>;
}

const fieldBase =
  "w-full bg-ink border border-line rounded-lg px-3 py-2 text-bone text-sm focus:outline-none focus:border-bronze";
const labelBase = "text-bone-dim text-xs uppercase tracking-wider block mb-1.5";

export default function NewBookingForm() {
  const [state, action, pending] = useActionState(createManualBooking, initialState);
  const errs = state?.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-8">
      <section className="border border-line rounded-xl p-5 space-y-4">
        <h2 className="text-bone text-sm font-mono-accent tracking-widest uppercase">Appointment</h2>

        <div>
          <label className={labelBase} htmlFor="service">Service</label>
          <select id="service" name="service" required className={fieldBase} defaultValue="">
            <option value="" disabled>Select a service…</option>
            {SERVICE_SLUGS.map((s) => (
              <option key={s} value={s}>{SERVICE_LABELS[s]}</option>
            ))}
          </select>
          <FieldError msg={errs.service?.[0]} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelBase} htmlFor="date">Date</label>
            <input id="date" name="date" type="date" required className={fieldBase} />
            <FieldError msg={errs.date?.[0]} />
          </div>
          <div>
            <label className={labelBase} htmlFor="timeWindow">Time window</label>
            <select id="timeWindow" name="timeWindow" required className={fieldBase} defaultValue="">
              <option value="" disabled>Select…</option>
              {TIME_WINDOWS.map((t) => (
                <option key={t} value={t}>{TIME_WINDOW_LABELS[t]}</option>
              ))}
            </select>
            <FieldError msg={errs.timeWindow?.[0]} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelBase} htmlFor="status">Status</label>
            <select id="status" name="status" className={fieldBase} defaultValue="CONFIRMED">
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
          <div>
            <label className={labelBase} htmlFor="price">Price ($)</label>
            <input id="price" name="price" type="number" min="0" step="0.01" placeholder="e.g. 200" className={fieldBase} />
            <FieldError msg={errs.price?.[0]} />
          </div>
        </div>
      </section>

      <section className="border border-line rounded-xl p-5 space-y-4">
        <h2 className="text-bone text-sm font-mono-accent tracking-widest uppercase">Customer</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelBase} htmlFor="name">Name</label>
            <input id="name" name="name" required className={fieldBase} />
            <FieldError msg={errs.name?.[0]} />
          </div>
          <div>
            <label className={labelBase} htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required className={fieldBase} />
            <FieldError msg={errs.email?.[0]} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelBase} htmlFor="phone">Phone</label>
            <input id="phone" name="phone" className={fieldBase} />
            <FieldError msg={errs.phone?.[0]} />
          </div>
          <div>
            <label className={labelBase} htmlFor="zip">ZIP</label>
            <input id="zip" name="zip" className={fieldBase} />
            <FieldError msg={errs.zip?.[0]} />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className={labelBase} htmlFor="address">Address</label>
            <input id="address" name="address" className={fieldBase} />
            <FieldError msg={errs.address?.[0]} />
          </div>
          <div>
            <label className={labelBase} htmlFor="city">City</label>
            <input id="city" name="city" className={fieldBase} />
            <FieldError msg={errs.city?.[0]} />
          </div>
        </div>
      </section>

      <section className="border border-line rounded-xl p-5 space-y-4">
        <h2 className="text-bone text-sm font-mono-accent tracking-widest uppercase">Vehicle</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className={labelBase} htmlFor="year">Year</label>
            <input id="year" name="year" type="number" inputMode="numeric" required className={fieldBase} />
            <FieldError msg={errs.year?.[0]} />
          </div>
          <div>
            <label className={labelBase} htmlFor="make">Make</label>
            <input id="make" name="make" required className={fieldBase} />
            <FieldError msg={errs.make?.[0]} />
          </div>
          <div>
            <label className={labelBase} htmlFor="model">Model</label>
            <input id="model" name="model" required className={fieldBase} />
            <FieldError msg={errs.model?.[0]} />
          </div>
          <div>
            <label className={labelBase} htmlFor="color">Color</label>
            <input id="color" name="color" required className={fieldBase} />
            <FieldError msg={errs.color?.[0]} />
          </div>
        </div>
      </section>

      <section className="border border-line rounded-xl p-5 space-y-4">
        <h2 className="text-bone text-sm font-mono-accent tracking-widest uppercase">Notes</h2>
        <div>
          <label className={labelBase} htmlFor="notes">Customer notes</label>
          <textarea id="notes" name="notes" rows={3} className={`${fieldBase} resize-none`} />
        </div>
        <div>
          <label className={labelBase} htmlFor="adminNotes">Admin notes (internal)</label>
          <textarea id="adminNotes" name="adminNotes" rows={3} className={`${fieldBase} resize-none`} />
        </div>
      </section>

      {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn-primary disabled:opacity-50">
          {pending ? "Saving…" : "Create booking"}
        </button>
      </div>
    </form>
  );
}
