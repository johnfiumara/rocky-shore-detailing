"use client";

import { useState, useTransition } from "react";
import { updateServiceTierPrice, toggleServiceActive } from "../actions";

type Tier = { id: string; size: string; price: number };
type Service = { id: string; slug: string; title: string; active: boolean; tiers: Tier[] };

export default function ServicesTable({ services }: { services: Service[] }) {
  return (
    <div className="border border-line rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            <th className="px-4 py-3 text-bone-dim font-normal text-xs uppercase tracking-wider">Service</th>
            <th className="px-4 py-3 text-bone-dim font-normal text-xs uppercase tracking-wider">S</th>
            <th className="px-4 py-3 text-bone-dim font-normal text-xs uppercase tracking-wider">M</th>
            <th className="px-4 py-3 text-bone-dim font-normal text-xs uppercase tracking-wider">L</th>
            <th className="px-4 py-3 text-bone-dim font-normal text-xs uppercase tracking-wider">Active</th>
          </tr>
        </thead>
        <tbody>
          {services.map((s) => (
            <ServiceRow key={s.id} service={s} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ServiceRow({ service }: { service: Service }) {
  const [, startTransition] = useTransition();
  const [active, setActive] = useState(service.active);

  const tier = (size: string) => service.tiers.find((t) => t.size === size);

  return (
    <tr className="border-b border-line last:border-0">
      <td className="px-4 py-3 text-bone">{service.title}</td>
      {["S", "M", "L"].map((size) => {
        const t = tier(size);
        return (
          <td key={size} className="px-4 py-3">
            {t ? <PriceCell tier={t} /> : <span className="text-bone-dim">—</span>}
          </td>
        );
      })}
      <td className="px-4 py-3">
        <button
          onClick={() => {
            const next = !active;
            setActive(next);
            startTransition(() => toggleServiceActive(service.id, next));
          }}
          className={`w-8 h-5 rounded-full transition-colors ${active ? "bg-bronze" : "bg-line"}`}
        >
          <span className={`block w-3.5 h-3.5 bg-bone rounded-full transition-transform mx-0.5 ${active ? "translate-x-3" : "translate-x-0"}`} />
        </button>
      </td>
    </tr>
  );
}

function PriceCell({ tier }: { tier: Tier }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(tier.price.toString());
  const [, startTransition] = useTransition();

  const save = () => {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      startTransition(() => updateServiceTierPrice(tier.id, parsed));
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => e.key === "Enter" && save()}
        autoFocus
        className="w-20 bg-surface border border-bronze rounded px-2 py-0.5 text-bone text-sm focus:outline-none"
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="text-bone hover:text-bronze transition-colors"
    >
      ${tier.price}
    </button>
  );
}
