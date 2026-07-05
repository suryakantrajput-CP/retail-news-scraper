import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/**": ["./data-snapshot/**"],
  },
};

export default nextConfig;
