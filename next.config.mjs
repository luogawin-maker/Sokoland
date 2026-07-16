/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.harvestwire.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },
  compress: true,
};

export default nextConfig;
