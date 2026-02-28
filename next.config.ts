import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["encoding", "pino-pretty"],
};

export default nextConfig;
