import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Serve originals directly while Vercel Image Optimization is payment-blocked.
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "wjhgkqczmqvwodjdsutq.supabase.co" },
      { protocol: "https", hostname: "static.orulo.com.br" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.meuapecomrosa.com.br" }],
        destination: "https://meuapecomrosa.com.br/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
