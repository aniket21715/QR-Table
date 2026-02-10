"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  authApi,
  getAuthToken,
  getRestaurantName,
  setRestaurantName,
  tablesApi
} from "../lib/api.js";

const FOOD_IMAGES = [
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1551782450-17144efb9c50?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80"
];

const FALLBACK_RESTAURANT_NAME =
  process.env.NEXT_PUBLIC_RESTAURANT_NAME || "Your Restaurant";
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=80";

export default function Home() {
  const [restaurantName, setRestaurantNameState] = useState(FALLBACK_RESTAURANT_NAME);
  const [tables, setTables] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    const token = getAuthToken();
    const storedName = getRestaurantName();

    if (storedName) {
      setRestaurantNameState(storedName);
    }

    if (token) {
      authApi
        .me()
        .then((data) => {
          if (!isMounted) return;
          const name = data?.restaurant_name || FALLBACK_RESTAURANT_NAME;
          setRestaurantNameState(name);
          setRestaurantName(name);
        })
        .catch(() => {
          // Keep fallback name if profile fetch is unavailable.
        });
    }

    tablesApi
      .publicList()
      .then((data) => {
        if (!isMounted) return;
        setTables(Array.isArray(data) ? data.slice(0, 6) : []);
        setError("");
      })
      .catch((err) => {
        if (!isMounted) return;
        setTables([]);
        setError(err.message || "Unable to load table QR codes.");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-10">
      <section className="hero-surface relative overflow-hidden rounded-[2rem] border border-white/60 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.6)]">
        <img
          src={HERO_IMAGE}
          alt="Restaurant ambience"
          className="hero-image absolute inset-0 h-full w-full object-cover"
        />
        <div className="hero-overlay absolute inset-0" />
        <div className="relative z-10 grid gap-8 p-7 lg:grid-cols-[1.1fr_1fr] lg:p-10">
          <div className="space-y-6">
            <p className="brand-chip">Smart Dining Experience</p>
            <h1 className="font-display text-6xl leading-[0.9] text-white md:text-7xl">
              {restaurantName}
            </h1>
            <p className="max-w-xl text-lg text-slate-100">
              Scan QR. Pick food. Pay fast. Built for busy restaurants.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/menu"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-100"
              >
                Open Menu
              </Link>
              <Link
                href="/admin"
                className="rounded-full border border-white/60 bg-white/15 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:-translate-y-0.5 hover:bg-white/25"
              >
                Manage Restaurant
              </Link>
            </div>
          </div>

          <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-3xl border border-white/40 bg-white/10 p-4 backdrop-blur-sm">
            <div className="pointer-events-none absolute h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl" />
            <div className="food-orbit">
              {FOOD_IMAGES.map((src, index) => {
                const angle = (360 / FOOD_IMAGES.length) * index;
                return (
                  <div
                    key={src}
                    className="food-orbit-item"
                    style={{ "--orbit-angle": `${angle}deg` }}
                  >
                    <img
                      src={src}
                      alt="Featured dish"
                      className="h-full w-full object-cover"
                    />
                  </div>
                );
              })}
            </div>
            <div className="relative z-10 rounded-full border border-white/70 bg-white/90 px-6 py-3 text-center shadow">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Now Serving</p>
              <p className="font-display text-3xl text-slate-900">Fresh + Fast</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/75 p-5 shadow-lg backdrop-blur-sm">
        <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-36 w-36 rounded-full bg-orange-200/40 blur-3xl" />

        <div className="relative z-10 mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="brand-pill">Scan & Sit</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Table QR Access</h2>
            <p className="text-sm text-slate-600">
              Quick scan cards for direct table ordering.
            </p>
          </div>
          <Link
            href="/menu"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 hover:bg-slate-50"
          >
            Go To Menu
          </Link>
        </div>

        {error && (
          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        )}

        {!error && tables.length === 0 && (
          <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
            No public tables found. Add tables from the admin panel.
          </div>
        )}

        <div className="relative z-10 mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {tables.map((table) => (
            <a
              key={table.id}
              href={tablesApi.menuUrl(table)}
              className="group rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Table</p>
                <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-white">
                  {table.label || table.id}
                </span>
              </div>
              <img
                src={tablesApi.qrUrl(table.id)}
                alt={`QR for ${table.label || `table ${table.id}`}`}
                className="mx-auto h-20 w-20 rounded-lg border border-slate-200 bg-white"
              />
              <p className="mt-2 truncate text-center text-[11px] text-slate-500">
                {table.code}
              </p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
