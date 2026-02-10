"use client";

import { CartProvider } from "@/context/CartContext.jsx";

export default function Providers({ children }) {
  return <CartProvider>{children}</CartProvider>;
}
