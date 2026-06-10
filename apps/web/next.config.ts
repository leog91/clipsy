import type { NextConfig } from "next";
// import { existsSync, readFileSync } from "fs";
// import { resolve } from "path";



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

// const rootEnvPath = resolve(__dirname, "../../.env");

// if (existsSync(rootEnvPath)) {
//   for (const line of readFileSync(rootEnvPath, "utf-8").split("\n")) {
//     const trimmed = line.trim();

//     if (!trimmed || trimmed.startsWith("#")) continue;

//     const separatorIndex = trimmed.indexOf("=");
//     if (separatorIndex === -1) continue;

//     const key = trimmed.slice(0, separatorIndex);
//     const value = trimmed.slice(separatorIndex + 1);

//     process.env[key] ??= value;
//   }
// }

const nextConfig: NextConfig = {
  transpilePackages: ["@clipsy/db", "@clipsy/shared"],
  serverExternalPackages: ["!@libsql/client", "!libsql", "!@libsql/linux-x64-gnu"],
};

export default nextConfig;
