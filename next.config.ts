import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["capjs-core", "esbuild"],
};

export default nextConfig;
