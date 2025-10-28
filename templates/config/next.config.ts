import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile shadpanel package for proper module resolution
  transpilePackages: ["shadpanel"],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dummyjson.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
