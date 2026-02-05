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
    <section className="rounded-3xl glass p-6 text-slate-900 shadow-lg">
      <p className="text-xs uppercase tracking-[0.3em] text-teal-500">Smart Picks</p>
      <h2 className="mt-2 text-2xl font-semibold">Trending now</h2>
      {error && <p className="mt-3 text-sm text-rose-500">{error}</p>}
      {!error && trending.length === 0 && (
        <p className="mt-3 text-sm text-slate-500">No trending items yet.</p>
      )}
      <ul className="mt-4 space-y-2 text-sm text-slate-700">
        {trending.map((pick) => (
          <li key={pick.id} className="rounded-xl bg-white/70 px-4 py-2">
            {pick.name} · {pick.orders} orders
          </li>
        ))}
      </ul>
      {fbt.length > 0 && (
        <>
          <h3 className="mt-6 text-sm font-semibold text-teal-600">
            Frequently bought together
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {fbt.map((item) => (
              <li key={item.id} className="rounded-xl bg-white/70 px-4 py-2">
                {item.name} · {item.together} orders
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
