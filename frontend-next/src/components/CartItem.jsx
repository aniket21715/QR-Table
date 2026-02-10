"use client";

export default function CartItem({ item, onQuantityChange, onNoteChange }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-800">{item.name}</p>
          <p className="text-sm text-slate-500">${item.price.toFixed(2)} each</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="rounded-full border border-slate-200 px-3 py-1 text-sm"
            onClick={() => onQuantityChange(item.id, item.quantity - 1)}
          >
            -
          </button>
          <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700">
            {item.quantity}
          </span>
          <button
            className="rounded-full border border-slate-200 px-3 py-1 text-sm"
            onClick={() => onQuantityChange(item.id, item.quantity + 1)}
          >
            +
          </button>
          <span className="text-sm font-semibold text-slate-900">
            ${(item.price * item.quantity).toFixed(2)}
          </span>
        </div>
      </div>
      <input
        className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
        placeholder="Special instructions (no onions, extra sauce)"
        value={item.special_instructions || ""}
        onChange={(event) => onNoteChange(item.id, event.target.value)}
      />
    </div>
  );
}

