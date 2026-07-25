import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

// In development, auto-allow all local IPv4 addresses for HMR/chunks.
// This is never applied in production — zero overhead on Cloudlets.
if (process.env.NODE_ENV !== "production") {
  // Use synchronous require-style import; next.config.ts is CommonJS-transpiled
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const os = require("os") as typeof import("os");
  const ifaceMap = os.networkInterfaces();
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

  nextConfig.allowedDevOrigins = [...origins];
}

export default nextConfig;
