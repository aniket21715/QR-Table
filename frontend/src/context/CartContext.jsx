import { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const params = new URLSearchParams(window.location.search);
  const initialRestaurantId = Number(params.get("restaurant")) || null;
  const initialTableId = Number(params.get("table")) || null;
  const initialTableCode = params.get("code") || null;

  const [restaurantId] = useState(initialRestaurantId);
  const [tableId] = useState(initialTableId);
  const [tableCode] = useState(initialTableCode);
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState("");

  const addItem = (item) => {
    setItems((prev) => {
      const existing = prev.find((entry) => entry.id === item.id);
      if (existing) {
        return prev.map((entry) =>
          entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry
        );
      }
      return [...prev, { ...item, quantity: 1, special_instructions: "" }];
    });
  };

  const updateQuantity = (id, quantity) => {
    setItems((prev) =>
      prev
        .map((entry) => (entry.id === id ? { ...entry, quantity } : entry))
        .filter((entry) => entry.quantity > 0)
    );
  };

  const setInstruction = (id, value) => {
    setItems((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, special_instructions: value } : entry
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setNotes("");
  };

  const value = useMemo(
    () => ({
      restaurantId,
      tableId,
      tableCode,
      items,
      notes,
      setNotes,
      addItem,
      updateQuantity,
      setInstruction,
      clearCart
    }),
    [restaurantId, tableId, tableCode, items, notes]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
