import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";

function getLocalDevOrigins(): string[] {
  const ifaceMap = networkInterfaces();
  const hosts = new Set<string>(["localhost", "127.0.0.1"]);

  for (const entries of Object.values(ifaceMap)) {
    for (const info of entries ?? []) {
      if (info.family === "IPv4" && !info.internal) {
        hosts.add(info.address);
      }
    }
  }

  const origins = new Set<string>();
  for (const host of hosts) {
    origins.add(host);
    origins.add(`http://${host}:3000`);
  }

  return [...origins];
}

const nextConfig: NextConfig = {
  // Auto-allow all current local IPv4 addresses for dev assets (HMR/chunks).
  // If network changes, restart `npm run dev` to refresh this list.
  allowedDevOrigins: getLocalDevOrigins(),
};

export default nextConfig;
