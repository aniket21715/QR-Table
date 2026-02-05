import { useEffect, useMemo, useState } from "react";
import MenuItem from "../components/MenuItem.jsx";
import Recommendations from "../components/Recommendations.jsx";
import { menuApi, recommendationsApi, tablesApi } from "../lib/api.js";
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
  const [availableTables, setAvailableTables] = useState([]);
  const [tableCode, setTableCode] = useState("");
  const [tableLookupError, setTableLookupError] = useState("");
  const [tableLookupLoading, setTableLookupLoading] = useState(false);

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
      setError("");
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
    if (restaurantId) return;
    let isMounted = true;
    tablesApi
      .publicList()
      .then((data) => {
        if (isMounted) setAvailableTables(data);
      })
      .catch(() => {
        if (isMounted) setAvailableTables([]);
      });
    return () => {
      isMounted = false;
    };
  }, [restaurantId]);

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

  const handleTableLookup = () => {
    if (!tableCode.trim()) return;
    setTableLookupLoading(true);
    setTableLookupError("");
    tablesApi
      .lookupByCode(tableCode.trim())
      .then((table) => {
        const params = new URLSearchParams({
          restaurant: table.restaurant_id,
          table: table.id,
          code: table.code
        });
        window.location.href = `/?${params.toString()}`;
      })
      .catch((err) => {
        setTableLookupError(err.message || "Table not found");
      })
      .finally(() => {
        setTableLookupLoading(false);
      });
  };

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

      {!restaurantId && (
        <section className="rounded-3xl glass p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-slate-800">Join your table</h2>
          <p className="mt-1 text-sm text-slate-600">
            Pick your table from the list or type the table code printed on your table.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-[1.2fr_1fr]">
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Available tables
              </label>
              <select
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                defaultValue=""
                onChange={(event) => {
                  const selectedId = Number(event.target.value);
                  const table = availableTables.find((item) => item.id === selectedId);
                  if (!table) return;
                  window.location.href = tablesApi.menuUrl(table);
                }}
              >
                <option value="" disabled>
                  Select a table
                </option>
                {availableTables.map((table) => (
                  <option key={table.id} value={table.id}>
                    {table.label} ({table.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Table code
              </label>
              <div className="mt-2 flex flex-wrap gap-3">
                <input
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Enter table code"
                  value={tableCode}
                  onChange={(event) => setTableCode(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleTableLookup();
                  }}
                />
                <button
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                  onClick={handleTableLookup}
                  disabled={tableLookupLoading}
                >
                  {tableLookupLoading ? "Checking..." : "Open Menu"}
                </button>
              </div>
            </div>
          </div>
          {tableLookupError && (
            <p className="mt-3 text-sm text-rose-600">{tableLookupError}</p>
          )}
        </section>
      )}

      {restaurantId && (
        <>
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
        </>
      )}
    </div>
  );
}
