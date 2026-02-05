import { useEffect, useMemo, useState } from "react";
import {
  analyticsApi,
  getAuthToken,
  menuApi,
  orderApi,
  recommendationsApi,
  setAuthToken,
  tablesApi
} from "../lib/api.js";

const SECTIONS = [
  { id: "insights", label: "Insights" },
  { id: "menu", label: "Menu" },
  { id: "tables", label: "Tables" }
];

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export default function Admin() {
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState({});
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [trending, setTrending] = useState([]);
  const [history, setHistory] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [hourly, setHourly] = useState([]);
  const [error, setError] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [itemForm, setItemForm] = useState({
    name: "",
    price: "",
    description: "",
    category_id: ""
  });
  const [dietTag, setDietTag] = useState("");
  const [tableLabel, setTableLabel] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [auth, setAuth] = useState({
    name: "",
    email: "",
    password: "",
    restaurant_name: "",
    city: ""
  });
  const [isAuthed, setIsAuthed] = useState(() => !!getAuthToken());
  const [section, setSection] = useState("insights");

  const loadAll = () => {
    Promise.allSettled([
      analyticsApi.summary(),
      analyticsApi.status(),
      analyticsApi.topItems(6),
      analyticsApi.byCategory(),
      analyticsApi.byHour(7),
      menuApi.getCategories(),
      menuApi.getItems(),
      tablesApi.list(),
      recommendationsApi.trending(5),
      orderApi.history("?limit=10").catch(() => [])
    ]).then((results) => {
      const [
        summaryRes,
        statusRes,
        topRes,
        categorySalesRes,
        hourRes,
        categoryRes,
        itemRes,
        tableRes,
        trendRes,
        historyRes
      ] = results;

      if (summaryRes.status === "fulfilled") setSummary(summaryRes.value);
      if (statusRes.status === "fulfilled") setStatus(statusRes.value || {});
      if (topRes.status === "fulfilled") setTopItems(topRes.value || []);
      if (categorySalesRes.status === "fulfilled") setCategorySales(categorySalesRes.value || []);
      if (hourRes.status === "fulfilled") setHourly(hourRes.value || []);
      if (categoryRes.status === "fulfilled") setCategories(categoryRes.value || []);
      if (itemRes.status === "fulfilled") setItems(itemRes.value || []);
      if (tableRes.status === "fulfilled") setTables(tableRes.value || []);
      if (trendRes.status === "fulfilled") setTrending(trendRes.value || []);
      if (historyRes.status === "fulfilled") setHistory(historyRes.value || []);

      const firstError = results.find((res) => res.status === "rejected");
      if (firstError) {
        const message = firstError.reason?.message || "Failed to load admin data";
        if (message.includes("Invalid token") || message.includes("Missing token")) {
          setAuthToken(null);
          setIsAuthed(false);
          setError("Session expired. Please log in again.");
          return;
        }
        setError(message);
      } else {
        setError("");
      }
    });
  };

  useEffect(() => {
    if (isAuthed) {
      loadAll();
    }
  }, [isAuthed]);

  const insights = useMemo(() => {
    const insightsList = [];
    if (summary?.total_orders) {
      insightsList.push(`Total orders so far: ${summary.total_orders}.`);
    }
    if (topItems.length > 0) {
      insightsList.push(`Top item: ${topItems[0].name} (${topItems[0].orders} orders).`);
    }
    if (categorySales.length > 0) {
      insightsList.push(`Best category: ${categorySales[0].category} at ${formatCurrency(categorySales[0].revenue)}.`);
    }
    if (hourly.length > 0) {
      const peak = [...hourly].sort((a, b) => b.orders - a.orders)[0];
      insightsList.push(`Peak hour: ${peak.hour}:00 with ${peak.orders} orders.`);
    }
    if (summary && summary.total_orders === 0) {
      insightsList.push("No orders yet. Add menu items and share the QR to start activity.");
    }
    return insightsList;
  }, [summary, topItems, categorySales, hourly]);

  const handleAuth = async () => {
    try {
      const endpoint = authMode === "signup" ? "/auth/signup" : "/auth/login";
      const body =
        authMode === "signup"
          ? {
              name: auth.name,
              email: auth.email,
              password: auth.password,
              restaurant_name: auth.restaurant_name,
              city: auth.city || null
            }
          : { email: auth.email, password: auth.password };

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE || "http://localhost:8000/api"}${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        }
      );
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Login failed");
      }
      const data = await response.json();
      setAuthToken(data.token);
      setIsAuthed(true);
      setError("");
    } catch (err) {
      setError(err.message || "Login failed");
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setIsAuthed(false);
  };

  const handleCreateCategory = async () => {
    if (!categoryName.trim()) return;
    try {
      await menuApi.createCategory({ name: categoryName.trim() });
      setCategoryName("");
      loadAll();
    } catch (err) {
      setError(err.message || "Failed to create category");
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  };

  const handleUpdateCategory = async (categoryId) => {
    if (!editingCategoryName.trim()) return;
    try {
      await menuApi.updateCategory(categoryId, { name: editingCategoryName.trim() });
      setEditingCategoryId(null);
      setEditingCategoryName("");
      loadAll();
    } catch (err) {
      setError(err.message || "Failed to update category");
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      await menuApi.deleteCategory(categoryId);
      loadAll();
    } catch (err) {
      setError(err.message || "Failed to delete category");
    }
  };

  const handleCreateItem = async () => {
    if (!itemForm.name || !itemForm.price) return;
    try {
      await menuApi.createItem({
        name: itemForm.name,
        price: Number(itemForm.price),
        description: itemForm.description || null,
        category_id: itemForm.category_id ? Number(itemForm.category_id) : null,
        is_available: true,
        diet_tag: dietTag || null
      });
      setItemForm({ name: "", price: "", description: "", category_id: "" });
      setDietTag("");
      loadAll();
    } catch (err) {
      setError(err.message || "Failed to create item");
    }
  };

  const toggleAvailability = async (item) => {
    try {
      await menuApi.updateItem(item.id, { is_available: !item.is_available });
      loadAll();
    } catch (err) {
      setError(err.message || "Failed to update item");
    }
  };

  const deleteItem = async (id) => {
    try {
      await menuApi.deleteItem(id);
      loadAll();
    } catch (err) {
      setError(err.message || "Failed to delete item");
    }
  };

  const handleCreateTable = async () => {
    if (!tableLabel.trim()) return;
    try {
      await tablesApi.create({ label: tableLabel.trim() });
      setTableLabel("");
      loadAll();
    } catch (err) {
      setError(err.message || "Failed to create table");
    }
  };

  const deleteTable = async (id) => {
    try {
      await tablesApi.delete(id);
      loadAll();
    } catch (err) {
      setError(err.message || "Failed to delete table");
    }
  };

  if (!isAuthed) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl glass p-8 shadow-lg">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl text-slate-900">Admin Access</h1>
          <div className="flex gap-2">
            <button
              className={`rounded-full px-4 py-2 text-xs font-semibold ${
                authMode === "login" ? "bg-slate-900 text-white" : "bg-white/70 text-slate-600"
              }`}
              onClick={() => setAuthMode("login")}
            >
              Login
            </button>
            <button
              className={`rounded-full px-4 py-2 text-xs font-semibold ${
                authMode === "signup" ? "bg-slate-900 text-white" : "bg-white/70 text-slate-600"
              }`}
              onClick={() => setAuthMode("signup")}
            >
              Sign Up
            </button>
          </div>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          {authMode === "login"
            ? "Log in to manage menu, tables, and insights."
            : "Create a restaurant owner account to get started."}
        </p>
        {error && (
          <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}
        <div className="mt-6 grid gap-4">
          {authMode === "signup" && (
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Full name"
              value={auth.name}
              onChange={(event) => setAuth({ ...auth, name: event.target.value })}
            />
          )}
          <input
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Email"
            value={auth.email}
            onChange={(event) => setAuth({ ...auth, email: event.target.value })}
          />
          <input
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            type="password"
            placeholder="Password"
            value={auth.password}
            onChange={(event) => setAuth({ ...auth, password: event.target.value })}
          />
          {authMode === "signup" && (
            <>
              <input
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Restaurant name"
                value={auth.restaurant_name}
                onChange={(event) => setAuth({ ...auth, restaurant_name: event.target.value })}
              />
              <input
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="City"
                value={auth.city}
                onChange={(event) => setAuth({ ...auth, city: event.target.value })}
              />
            </>
          )}
          <button
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            onClick={handleAuth}
          >
            {authMode === "login" ? "Login" : "Create account"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-slate-900">Owner Dashboard</h1>
          <p className="text-slate-600">Manage menu, tables, and live trends.</p>
        </div>
        <button
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
          onClick={handleLogout}
        >
          Logout
        </button>
      </header>

      <div className="flex flex-wrap gap-3">
        {SECTIONS.map((tab) => (
          <button
            key={tab.id}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              section === tab.id
                ? "bg-slate-900 text-white"
                : "bg-white/70 text-slate-600 hover:bg-white"
            }`}
            onClick={() => setSection(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {section === "insights" && (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl glass p-6 shadow-lg">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Total</p>
              <p className="mt-2 text-3xl font-semibold">
                ${summary?.total_revenue?.toFixed(2) || "0.00"}
              </p>
              <p className="text-sm text-slate-500">Revenue</p>
            </div>
            <div className="rounded-3xl glass p-6 shadow-lg">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Orders</p>
              <p className="mt-2 text-3xl font-semibold">{summary?.total_orders || 0}</p>
              <p className="text-sm text-slate-500">All time</p>
            </div>
            <div className="rounded-3xl glass p-6 shadow-lg">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Open</p>
              <p className="mt-2 text-3xl font-semibold">{status.pending || 0}</p>
              <p className="text-sm text-slate-500">Pending orders</p>
            </div>
          </div>

          <section className="rounded-3xl glass p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-800">Owner Insights</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {insights.length === 0 && <li>No insights yet.</li>}
              {insights.map((item) => (
                <li key={item} className="rounded-xl bg-slate-50 px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl glass p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-slate-800">Top Items</h2>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {topItems.map((item) => (
                  <li key={item.id} className="rounded-xl bg-slate-50 px-3 py-2">
                    {item.name} � {item.orders} orders � {formatCurrency(item.revenue)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl glass p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-slate-800">Sales by Category</h2>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {categorySales.map((cat) => (
                  <li key={cat.category} className="rounded-xl bg-slate-50 px-3 py-2">
                    {cat.category} � {formatCurrency(cat.revenue)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl glass p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-slate-800">Orders by Hour</h2>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {hourly.map((slot) => (
                  <li key={slot.hour} className="rounded-xl bg-slate-50 px-3 py-2">
                    {slot.hour}:00 � {slot.orders} orders
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="rounded-3xl glass p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-800">Recent Orders</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {history.slice(0, 6).map((order) => (
                <li key={order.id} className="rounded-xl bg-slate-50 px-3 py-2">
                  Order #{order.id} � {order.status}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {section === "menu" && (
        <>
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl glass p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-slate-800">Menu Categories</h2>
              <div className="mt-4 flex gap-3">
                <input
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="New category"
                  value={categoryName}
                  onChange={(event) => setCategoryName(event.target.value)}
                />
                <button
                  className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white"
                  onClick={handleCreateCategory}
                >
                  Add
                </button>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {categories.map((category) => (
                  <li key={category.id} className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {editingCategoryId === category.id ? (
                        <input
                          className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                          value={editingCategoryName}
                          onChange={(event) => setEditingCategoryName(event.target.value)}
                        />
                      ) : (
                        <span>{category.name}</span>
                      )}
                      <span className="text-xs text-slate-400">{category.items.length} items</span>
                    </div>
                    {category.id !== 0 && (
                      <div className="flex items-center gap-2">
                        {editingCategoryId === category.id ? (
                          <>
                            <button
                              className="rounded-full border border-slate-200 px-3 py-1 text-xs"
                              onClick={() => handleUpdateCategory(category.id)}
                            >
                              Save
                            </button>
                            <button
                              className="rounded-full border border-slate-200 px-3 py-1 text-xs"
                              onClick={() => {
                                setEditingCategoryId(null);
                                setEditingCategoryName("");
                              }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="rounded-full border border-slate-200 px-3 py-1 text-xs"
                              onClick={() => handleEditCategory(category)}
                            >
                              Edit
                            </button>
                            <button
                              className="rounded-full border border-rose-200 px-3 py-1 text-xs text-rose-600"
                              onClick={() => handleDeleteCategory(category.id)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl glass p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-slate-800">Add Menu Item</h2>
              <div className="mt-4 grid gap-3">
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Item name"
                  value={itemForm.name}
                  onChange={(event) => setItemForm({ ...itemForm, name: event.target.value })}
                />
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Price"
                  value={itemForm.price}
                  onChange={(event) => setItemForm({ ...itemForm, price: event.target.value })}
                />
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Description"
                  value={itemForm.description}
                  onChange={(event) => setItemForm({ ...itemForm, description: event.target.value })}
                />
                <select
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={itemForm.category_id}
                  onChange={(event) => setItemForm({ ...itemForm, category_id: event.target.value })}
                >
                  <option value="">No category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={dietTag}
                  onChange={(event) => setDietTag(event.target.value)}
                >
                  <option value="">Diet tag</option>
                  <option value="veg">Veg</option>
                  <option value="nonveg">Non-Veg</option>
                  <option value="vegan">Vegan</option>
                  <option value="gluten_free">Gluten-Free</option>
                </select>
                <button
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                  onClick={handleCreateItem}
                >
                  Save Item
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-3xl glass p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-800">Menu Items</h2>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-500">${item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs"
                      onClick={() => toggleAvailability(item)}
                    >
                      {item.is_available ? "Disable" : "Enable"}
                    </button>
                    <button
                      className="rounded-full border border-rose-200 px-3 py-1 text-xs text-rose-600"
                      onClick={() => deleteItem(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {section === "tables" && (
        <section className="rounded-3xl glass p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-slate-800">Tables & QR Codes</h2>
          <div className="mt-4 flex gap-3">
            <input
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Table label"
              value={tableLabel}
              onChange={(event) => setTableLabel(event.target.value)}
            />
            <button
              className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white"
              onClick={handleCreateTable}
            >
              Add
            </button>
          </div>
          <div className="mt-4 grid gap-4">
            {tables.map((table) => (
              <div key={table.id} className="flex items-center gap-4">
                <img
                  src={tablesApi.qrUrl(table.id)}
                  alt={`QR ${table.label}`}
                  className="h-16 w-16 rounded-xl border border-slate-200 bg-white"
                />
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{table.label}</p>
                  <p className="text-xs text-slate-500">Code: {table.code}</p>
                </div>
                <button
                  className="rounded-full border border-rose-200 px-3 py-1 text-xs text-rose-600"
                  onClick={() => deleteTable(table.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
