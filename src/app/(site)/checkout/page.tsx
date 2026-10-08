import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { getShippingSettings } from "@/lib/data/site";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };
export const revalidate = 60;

export default async function CheckoutPage() {
  const shipping = await getShippingSettings();
  const square = {
    appId: process.env.NEXT_PUBLIC_SQUARE_APP_ID ?? "",
    locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID ?? "",
    sandbox: process.env.SQUARE_ENVIRONMENT !== "production",
  };
  return (
    <section className="section container-page">
      <h1 className="display-xl mb-10">Checkout</h1>
      <CheckoutForm shipping={shipping} square={square} />
    </section>
  );
}
