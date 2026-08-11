import type { Metadata } from "next";
import { TrpcProvider } from "@/src/shared/trpc/cliente";
import "./globals.css";

export const metadata: Metadata = {
  title: "StateSell — a prefeitura quer comprar o que você vende",
  description:
    "A gente avisa quando a prefeitura da sua cidade quer comprar exatamente o que você vende. Você vai saber; disputar é com você.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <TrpcProvider>{children}</TrpcProvider>
      </body>
    </html>
  );
}
