"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/cart", label: "Cart" },
  { href: "/kitchen", label: "Kitchen" },
  { href: "/admin", label: "Admin" }
];

export default function AppShell({ children }) {
  const pathname = usePathname();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden gradient-bg text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-20 h-64 w-64 rounded-full bg-emerald-200/40 blur-3xl float-slow" />
        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl float-medium" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl float-slow" />
      </div>

      <header className="relative z-10 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
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
          <nav className="flex flex-wrap justify-end gap-2 text-xs font-semibold sm:text-sm">
            {navItems.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-2 transition ${
                    active
                      ? "bg-slate-900 text-white shadow-lg"
                      : "text-slate-600 hover:bg-white/70"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>

      <footer className="relative z-10 border-t border-slate-200/70 bg-white/75">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-5 text-sm text-slate-600">
          <p>
            QR Table helps restaurants run digital ordering, faster kitchen handoff, and cleaner
            table service.
          </p>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Web App by QR Table Team
          </p>
        </div>
      </footer>
    </div>
  );
}
