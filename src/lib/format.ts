import { siteConfig } from "./config";

const formatter = new Intl.NumberFormat(siteConfig.locale, {
  style: "currency",
  currency: siteConfig.currency,
});

export const formatPrice = (amount: number) => formatter.format(amount);
