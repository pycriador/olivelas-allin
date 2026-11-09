import { createFileRoute, useParams } from "@tanstack/react-router";

import { CheckoutPage } from "@/components/payments/CheckoutPage";

export const Route = createFileRoute("/c/$slug/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — RaffleHub" },
      { name: "description", content: "Finalize o pagamento dos seus números." },
    ],
  }),
  component: CheckoutRoute,
});

function CheckoutRoute() {
  const { slug } = useParams({ from: "/c/$slug/checkout" });
  return <CheckoutPage slug={slug} />;
}
