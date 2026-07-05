import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/retail-news-scraper",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
