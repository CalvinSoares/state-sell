import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // src/server/* é server-only; garantimos que nada de lá vaze para o bundle do cliente
  serverExternalPackages: ["postgres"],
  // Há um pnpm-lock.yaml em D:\PASTASD; fixamos a raiz neste projeto para o
  // file tracing da Vercel não subir de diretório.
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
};

export default nextConfig;
