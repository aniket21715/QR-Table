import { useEffect, useMemo, useState } from "react";
import MenuItem from "../components/MenuItem.jsx";
import Recommendations from "../components/Recommendations.jsx";
import { menuApi, recommendationsApi } from "../lib/api.js";
import { useCart } from "../context/CartContext.jsx";

const DIET_FILTERS = [
  { id: "all", label: "All" },
  { id: "veg", label: "Veg" },
  { id: "nonveg", label: "Non-Veg" },
  { id: "vegan", label: "Vegan" },
  { id: "gluten_free", label: "Gluten-Free" }
];

export default function Menu() {
  const { addItem, tableId, restaurantId } = useCart();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [diet, setDiet] = useState("all");
  const [search, setSearch] = useState("");
  const [trendingIds, setTrendingIds] = useState(new Set());

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (restaurantId) params.set("restaurant_id", restaurantId);
    if (diet !== "all") params.set("diet", diet);
    if (search.trim()) params.set("search", search.trim());
    const query = params.toString();
    return query ? `?${query}` : "";
  }, [diet, search, restaurantId]);

  useEffect(() => {
    if (!restaurantId) {
      setError("Missing restaurant. Please scan a table QR.");
      setLoading(false);
      return undefined;
    }
    let isMounted = true;
    setLoading(true);
    menuApi
      .getMenu(queryString)
      .then((data) => {
        if (isMounted) {
          setCategories(data);
          setError("");
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Failed to load menu");
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [queryString]);

  useEffect(() => {
    if (!restaurantId) {
      setTrendingIds(new Set());
      return;
    }
    recommendationsApi
      .trending(restaurantId, 6)
      .then((data) => {
        setTrendingIds(new Set(data.map((item) => item.id)));
      })
      .catch(() => {
        setTrendingIds(new Set());
      });
  }, [restaurantId]);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl glass p-6 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl text-slate-900">
              {tableId ? `Table ${tableId} Menu` : "Menu"}
            </h1>
            <p className="text-slate-600">
              Scan, tap, and send to the kitchen in under a minute.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-3 text-sm text-emerald-800">
            {tableId ? `Ordering for table ${tableId}` : "Tap any item to add to cart"}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {DIET_FILTERS.map((filter) => (
            <button
              key={filter.id}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                diet === filter.id
                  ? "bg-slate-900 text-white"
                  : "bg-white/70 text-slate-600 hover:bg-white"
              }`}
              onClick={() => setDiet(filter.id)}
            >
              {filter.label}
            </button>
          ))}
          <div className="ml-auto flex w-full max-w-sm items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm">
            <input
              className="w-full bg-transparent text-slate-700 outline-none"
              placeholder="Search menu"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
      </section>

      {loading && (
        <section className="rounded-3xl glass p-6 shadow-lg">
          <p className="text-slate-600">Loading menu...</p>
        </section>
      )}

      {error && (
        <section className="rounded-3xl glass p-6 shadow-lg">
          <p className="text-red-600">{error}</p>
        </section>
      )}

      {!loading &&
        !error &&
        (categories.length === 0 ? (
          <section className="rounded-3xl glass p-6 shadow-lg">
            <p className="text-slate-600">No menu items yet. Add items in Admin.</p>
          </section>
        ) : (
          categories.map((category) => (
            <section key={category.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-slate-800">{category.name}</h2>
                <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  {category.items.length} items
                </span>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {category.items.map((item) => (
                  <MenuItem
                    key={item.id}
                    item={item}
                    badge={trendingIds.has(item.id) ? "Popular" : null}
                    onAdd={() => addItem(item)}
                  />
                ))}
              </div>
            </section>
          ))
        ))}

      <Recommendations restaurantId={restaurantId} />
    </div>
  );
}
