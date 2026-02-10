"use client";

import { useEffect, useState } from "react";
import { getAuthToken, orderApi } from "../lib/api.js";

export default function OrderSuccess({ orderId = null }) {
  const [order, setOrder] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const token = getAuthToken();
    if (!orderId || !token) return () => {};
    orderApi
      .get(orderId)
      .then((data) => {
        if (isMounted) setOrder(data);
      })
      .catch(() => {
        if (isMounted) setOrder(null);
      });
    return () => {
      isMounted = false;
    };
  }, [orderId]);

  return (
    <div className="rounded-3xl glass p-8 text-center shadow-lg">
      <p className="text-xs uppercase tracking-[0.4em] text-teal-600">
        Order Confirmed
      </p>
      <h1 className="mt-3 font-display text-5xl text-slate-900">Thank you!</h1>
      <p className="mt-4 text-slate-600">
        Your order is in the kitchen. We will bring it to your table soon.
      </p>
      <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-4">
        <p className="text-sm text-slate-500">
          {orderId ? `Order #${orderId}` : "Order received"}
        </p>
        <p className="text-lg font-semibold text-slate-800">
          Status: {order?.status || "pending"}
        </p>
      </div>
    </div>
  );
}



