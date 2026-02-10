"use client";

import { orderApi } from "../lib/api.js";

const STATUS_FLOW = ["pending", "in_progress", "ready", "completed"];

function nextStatus(current) {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx === -1) return "pending";
  return STATUS_FLOW[Math.min(idx + 1, STATUS_FLOW.length - 1)];
}

export default function OrderCard({ order, onUpdate }) {
  const handleStatus = async () => {
    const newStatus = nextStatus(order.status);
    await orderApi.updateStatus(order.id, { status: newStatus });
    if (onUpdate) onUpdate();
  };

  return (
    <article className="rounded-3xl bg-white/90 p-6 shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Order #{order.id}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-800">
            {order.table_id ? `Table ${order.table_id}` : "Walk-in"}
          </h3>
        </div>
        <span className="rounded-full bg-teal-600 px-3 py-1 text-xs font-semibold text-white">
          {order.status.replace("_", " ")}
        </span>
      </div>
      <ul className="mt-4 space-y-2 text-sm text-slate-600">
        {(order.items || []).map((item) => (
          <li key={item.id} className="rounded-xl bg-slate-50 px-3 py-2">
            {item.menu_item?.name || `Item ${item.menu_item_id}`} Â· x{item.quantity}
          </li>
        ))}
      </ul>
      <button
        className="mt-6 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-teal-200 hover:bg-teal-50"
        onClick={handleStatus}
      >
        Advance to {nextStatus(order.status).replace("_", " ")}
      </button>
    </article>
  );
}

