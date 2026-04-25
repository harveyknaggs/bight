import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/my-site/:path*/",
        destination: "/my-site/:path*/index.html",
      },
    ];
  },
};

export default nextConfig;
