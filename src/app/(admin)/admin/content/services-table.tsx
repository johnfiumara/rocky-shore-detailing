"use client";

import { useState, useTransition } from "react";
import {
  updateServiceTierPrice,
  toggleServiceActive,
  updateServiceDescription,
  reorderServices,
} from "../actions";
import { ArrowUp, ArrowDown, Pencil } from "lucide-react";

type Tier = { id: string; size: string; price: number };
type Service = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  active: boolean;
  sortOrder: number;
  tiers: Tier[];
};

export default function ServicesTable({ services }: { services: Service[] }) {
  const [items, setItems] = useState(services);
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
      reorderServices(updates);
    });
  };

  return (
    <div className="space-y-3">
      <div className="border border-line rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="px-4 py-3 text-bone-dim font-normal text-xs uppercase tracking-wider">Order</th>
              <th className="px-4 py-3 text-bone-dim font-normal text-xs uppercase tracking-wider">Service</th>
              <th className="px-4 py-3 text-bone-dim font-normal text-xs uppercase tracking-wider">S</th>
              <th className="px-4 py-3 text-bone-dim font-normal text-xs uppercase tracking-wider">M</th>
              <th className="px-4 py-3 text-bone-dim font-normal text-xs uppercase tracking-wider">L</th>
              <th className="px-4 py-3 text-bone-dim font-normal text-xs uppercase tracking-wider">Active</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s, idx) => (
              <ServiceRow
                key={s.id}
                service={s}
                index={idx}
                total={items.length}
                move={move}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ServiceRow({
  service,
  index,
  total,
  move,
}: {
  service: Service;
  index: number;
  total: number;
  move: (i: number, dir: -1 | 1) => void;
}) {
  const [, start] = useTransition();
  const [active, setActive] = useState(service.active);
  const [editingDesc, setEditingDesc] = useState(false);
  const [description, setDescription] = useState(service.description ?? "");

  const toggleActive = () => {
    const next = !active;
    setActive(next);
    start(() => toggleServiceActive(service.id, next));
  };

  const saveDesc = () => {
    start(() => updateServiceDescription(service.id, description));
    setEditingDesc(false);
  };

  const tier = (size: string) => service.tiers.find((t) => t.size === size);

  return (
    <tr className="border-b border-line last:border-0">
      <td className="px-4 py-3">
        <div className="flex gap-1">
          <button
            onClick={() => move(index, -1)}
            disabled={index === 0}
            className="p-1 text-bone-dim hover:text-bone disabled:opacity-30 transition-colors"
          >
            <ArrowUp size={14} />
          </button>
          <button
            onClick={() => move(index, 1)}
            disabled={index === total - 1}
            className="p-1 text-bone-dim hover:text-bone disabled:opacity-30 transition-colors"
          >
            <ArrowDown size={14} />
          </button>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-bone">{service.title}</p>
        {editingDesc ? (
          <div className="mt-1 flex gap-2">
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              className="flex-1 bg-surface border border-line rounded px-2 py-1 text-bone-dim text-xs focus:outline-none focus:border-bronze"
            />
            <button
              onClick={saveDesc}
              className="text-xs text-bronze hover:underline"
            >
              Save
            </button>
            <button
              onClick={() => setEditingDesc(false)}
              className="text-xs text-bone-dim hover:text-bone"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 mt-0.5">
            {service.description ? (
              <p className="text-bone-dim text-xs truncate max-w-[200px]">
                {service.description}
              </p>
            ) : (
              <span className="text-bone-dim/50 text-xs italic">No description</span>
            )}
            <button
              onClick={() => setEditingDesc(true)}
              className="p-0.5 text-bone-dim hover:text-bone transition-colors"
            >
              <Pencil size={10} />
            </button>
          </div>
        )}
      </td>
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
          onClick={toggleActive}
          className={`w-8 h-5 rounded-full transition-colors ${active ? "bg-bronze" : "bg-line"}`}
        >
          <span
            className={`block w-3.5 h-3.5 bg-bone rounded-full transition-transform mx-0.5 ${
              active ? "translate-x-3" : "translate-x-0"
            }`}
          />
        </button>
      </td>
    </tr>
  );
}

function PriceCell({ tier }: { tier: Tier }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(tier.price.toString());
  const [, start] = useTransition();

  const save = () => {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      start(() => updateServiceTierPrice(tier.id, parsed));
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

