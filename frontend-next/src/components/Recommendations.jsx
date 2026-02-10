"use client";

import { useEffect, useState } from "react";
import { recommendationsApi } from "../lib/api.js";
import { useCart } from "../context/CartContext.jsx";

export default function Recommendations({ restaurantId }) {
  const { items } = useCart();
  const focusItemId = items[0]?.id;
  const [trending, setTrending] = useState([]);
  const [fbt, setFbt] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    if (!restaurantId) {
      setTrending([]);
      return () => {
        isMounted = false;
      };
    }
    recommendationsApi
      .trending(restaurantId, 5)
      .then((data) => {
        if (isMounted) {
          setTrending(data);
          setError("");
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Failed to load picks");
        }
      });
    return () => {
      isMounted = false;
    };
  }, [restaurantId]);

  useEffect(() => {
    let isMounted = true;
    if (!restaurantId || !focusItemId) {
      setFbt([]);
      return () => {
        isMounted = false;
      };
    }
    recommendationsApi
      .fbt(restaurantId, focusItemId, 4)
      .then((data) => {
        if (isMounted) {
          setFbt(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setFbt([]);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [focusItemId, restaurantId]);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-6 text-slate-900 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.45)]">
      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-emerald-200/50 blur-2xl" />
      <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">Smart Picks</p>
      <h2 className="mt-2 text-2xl font-semibold">Trending now</h2>
      {error && <p className="mt-3 text-sm text-rose-500">{error}</p>}
      {!error && trending.length === 0 && (
        <p className="mt-3 text-sm text-slate-500">No trending items yet.</p>
      )}
      <ul className="mt-4 space-y-3 text-sm text-slate-700">
        {trending.map((pick) => (
          <li
            key={pick.id}
            className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white/90 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <div>
                <p className="font-semibold text-slate-800">{pick.name}</p>
                <p className="text-xs text-slate-500">{pick.orders} orders</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Trending
            </span>
          </li>
        ))}
      </ul>
      {fbt.length > 0 && (
        <>
          <h3 className="mt-6 text-xs uppercase tracking-[0.3em] text-slate-400">
            Frequently bought together
          </h3>
          <ul className="mt-3 space-y-3 text-sm text-slate-700">
            {fbt.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white/90 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  <p className="font-semibold text-slate-800">{item.name}</p>
                </div>
                <span className="text-xs text-slate-500">{item.together} pairs</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

