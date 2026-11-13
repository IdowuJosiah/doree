const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    // Uploaded originals live in Supabase Storage; next/image resizes them
    // and the CDN caches the result.
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
  // Browser security headers on every page.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // No other site may show these pages in a frame (stops clickjacking,
          // e.g. a hidden admin page under a fake button).
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
          { key: "X-Frame-Options", value: "DENY" },
          // Files are only treated as the type the server says they are.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Other sites see only "shopdoree.co", never full addresses with order ids.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
