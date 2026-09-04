import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep isolated browser tests separate from an existing development server.
  distDir: process.env.ROSA_E2E === "1" ? ".next-e2e" : ".next",
  images: {
    // Serve originals directly while Vercel Image Optimization is payment-blocked.
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "wjhgkqczmqvwodjdsutq.supabase.co" },
      { protocol: "https", hostname: "static.orulo.com.br" },
    ],
  },
  async headers() {
    return [
      { source: "/:path*", has: [{ type: "host", value: ".*\\.vercel\\.app" }], headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }] },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.meuapecomrosa.com.br" }],
        destination: "https://meuapecomrosa.com.br/:path*",
        permanent: true,
      },
      { source: "/favicon.ico", destination: "/icon", permanent: true },
    ];
  },
};

export default nextConfig;
