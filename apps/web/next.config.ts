import type { NextConfig } from "next";
import { readFileSync } from "fs";
import { resolve } from "path";

// const envPath = resolve(__dirname, "../../.env");
// const envContent = readFileSync(envPath, "utf-8");
// const env: Record<string, string> = {};
// for (const line of envContent.split("\n")) {
//   const trimmed = line.trim();
//   if (trimmed && !trimmed.startsWith("#")) {
//     const [key, ...valueParts] = trimmed.split("=");
//     if (key && valueParts.length > 0) {
//       env[key] = valueParts.join("=");
//     }
//   }
// }

const nextConfig: NextConfig = {
  transpilePackages: ["@clipsy/db", "@clipsy/shared"],
  serverExternalPackages: ["!@libsql/client", "!libsql", "!@libsql/linux-x64-gnu"],

};

export default nextConfig;
