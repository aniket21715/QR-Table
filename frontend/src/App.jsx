import { NavLink, Route, Routes } from "react-router-dom";
import Menu from "./pages/Menu.jsx";
import Cart from "./pages/Cart.jsx";
import OrderSuccess from "./pages/OrderSuccess.jsx";
import Kitchen from "./pages/Kitchen.jsx";
import Admin from "./pages/Admin.jsx";
import { CartProvider } from "./context/CartContext.jsx";

const navItems = [
  { to: "/", label: "Menu" },
  { to: "/cart", label: "Cart" },
  { to: "/kitchen", label: "Kitchen" },
  { to: "/admin", label: "Admin" }
];

export default function App() {
  return (
    <CartProvider>
      <div className="relative min-h-screen overflow-hidden gradient-bg text-slate-900">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-20 h-64 w-64 rounded-full bg-emerald-200/40 blur-3xl float-slow" />
          <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl float-medium" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl float-slow" />
        </div>

        <header className="relative z-10 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
                QT
              </div>
              <div>
                <p className="font-display text-4xl tracking-wide text-slate-900">QR Table</p>
                <p className="text-xs uppercase tracking-[0.45em] text-slate-500">
                  Restaurant Order
                </p>
              </div>
            </div>
            <nav className="flex gap-2 text-sm font-semibold">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 transition ${
                      isActive
                        ? "bg-slate-900 text-white shadow-lg"
                        : "text-slate-600 hover:bg-white/70"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>

        <main className="relative z-10 mx-auto max-w-6xl px-6 py-10">
          <Routes>
            <Route path="/" element={<Menu />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/success" element={<OrderSuccess />} />
            <Route path="/kitchen" element={<Kitchen />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
      </div>
    </CartProvider>
  );
}
