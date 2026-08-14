import type { NextConfig } from "next";
import os from "os";

function getAllowedDevOrigins(): string[] {
  const origins = new Set<string>(["localhost", "127.0.0.1", "0.0.0.0"]);

  // Dynamically include all local network IPv4 addresses
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === "IPv4" && !net.internal) {
        origins.add(net.address);
      }
    }
  }

  // Support environment variable for custom origins (comma-separated)
  if (process.env.ALLOWED_DEV_ORIGINS) {
    process.env.ALLOWED_DEV_ORIGINS.split(",").forEach((item) => {
      if (item.trim()) origins.add(item.trim());
    });
  }

  return Array.from(origins);
}

const nextConfig: NextConfig = {
  turbopack: {},
  reactStrictMode: false,
  allowedDevOrigins: getAllowedDevOrigins(),
};

export default nextConfig;
