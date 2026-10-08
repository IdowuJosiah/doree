export const siteConfig = {
  name: "Dorée",
  tagline: "Jewelry created with love",
  instagram: { handle: "@doree", url: "https://www.instagram.com/" },
  contactEmail: "hello@example.com",
  // Optional one-line announcement bar. Empty string hides it.
  announcement: "",
  currency: "USD",
  locale: "en-US",
};

// Placeholder values: replace with the client's states and amounts.
export const shippingConfig = {
  fixedFeeStates: ["NY", "NJ", "CT"],
  fixedFee: 8,
  otherStatesFee: 15,
};

export const navLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/lookbook", label: "Lookbook" },
  { href: "/guides", label: "Care and guides" },
  { href: "/about", label: "About" },
];
