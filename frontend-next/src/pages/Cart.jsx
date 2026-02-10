"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CartItem from "../components/CartItem.jsx";
import { useCart } from "../context/CartContext.jsx";
import { orderApi } from "../lib/api.js";

export default function Cart() {
  const router = useRouter();
  const {
    items,
    updateQuantity,
    setInstruction,
    notes,
    setNotes,
    clearCart,
    tableId,
    restaurantId
  } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const handleSubmit = async () => {
    if (items.length === 0) {
      setError("Cart is empty.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = {
        restaurant_id: restaurantId,
        table_id: tableId,
        notes,
        items: items.map((item) => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          special_instructions: item.special_instructions || null
        }))
      };
      const order = await orderApi.create(payload);
      clearCart();
      router.push(`/success?order_id=${order.id}`);
    } catch (err) {
      setError(err.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl text-slate-900">Your Cart</h1>
        <p className="text-slate-600">Ready to send this to the kitchen?</p>
      </header>

      <div className="rounded-3xl glass p-6 shadow-lg">
        <div className="space-y-4">
          {items.length === 0 && (
            <p className="text-sm text-slate-500">Your cart is empty.</p>
          )}
          {items.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              onQuantityChange={updateQuantity}
              onNoteChange={setInstruction}
            />
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Order notes
          </label>
          <textarea
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            rows="3"
            placeholder="Allergy notes, extra napkins, etc."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Total</p>
          <p className="text-2xl font-semibold text-slate-900">${total.toFixed(2)}</p>
        </div>

        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

        <button
          className="mt-6 w-full rounded-2xl bg-teal-600 py-3 text-sm font-semibold text-white shadow hover:bg-teal-500 disabled:cursor-not-allowed disabled:bg-slate-300"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Order"}
        </button>
      </div>
    </div>
  );
}


