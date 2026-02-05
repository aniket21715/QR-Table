import { useEffect, useState } from "react";
import OrderCard from "../components/OrderCard.jsx";
import { getAuthToken, getWebSocketUrl, orderApi } from "../lib/api.js";

export default function Kitchen() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const loadOrders = () => {
    orderApi
      .list()
      .then((data) => {
        setOrders(data);
        setError("");
      })
      .catch((err) => {
        setError(err.message || "Failed to load orders");
      });
  };

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setError("Login required to view kitchen orders.");
      return () => {};
    }
    loadOrders();
    let pollInterval = null;
    const startPolling = () => {
      if (pollInterval) return;
      pollInterval = window.setInterval(loadOrders, 6000);
    };
    const stopPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    const socket = new WebSocket(getWebSocketUrl("/ws/orders"));
    socket.onopen = () => {
      stopPolling();
      setError("");
    };
    socket.onmessage = () => loadOrders();
    socket.onerror = () => {
      setError("WebSocket connection failed. Falling back to auto-refresh.");
      startPolling();
    };
    socket.onclose = () => {
      startPolling();
    };
    return () => {
      stopPolling();
      socket.close();
    };
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl text-slate-900">Kitchen Board</h1>
        <p className="text-slate-600">Live queue for your team.</p>
      </header>

      {error && (
        <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {orders
          .filter((order) => order.status !== "completed")
          .map((order) => (
          <OrderCard key={order.id} order={order} onUpdate={loadOrders} />
        ))}
      </div>
    </div>
  );
}

