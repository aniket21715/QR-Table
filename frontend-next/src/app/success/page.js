import OrderSuccessPage from "@/pages/OrderSuccess.jsx";

export default function Page({ searchParams }) {
  return <OrderSuccessPage orderId={searchParams?.order_id || null} />;
}
