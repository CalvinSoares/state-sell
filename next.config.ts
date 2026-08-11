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
  async headers() {
    const noIndex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    return [
      { source: "/api/:path*", headers: noIndex },
      { source: "/admin/:path*", headers: noIndex },
      { source: "/painel", headers: noIndex },
      { source: "/painel/:path*", headers: noIndex },
      { source: "/verificar", headers: noIndex },
      { source: "/feedback", headers: noIndex },
      { source: "/pronto", headers: noIndex },
    ];
  },
};

export default nextConfig;
