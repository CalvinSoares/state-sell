import type { Metadata } from "next";
import { TrpcProvider } from "@/src/shared/trpc/cliente";
import { ThemeToggle } from "@/src/shared/components/app/ThemeToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prefeitura Quer — a prefeitura da sua cidade quer comprar o que você vende",
  description:
    "A gente avisa quando a prefeitura da sua cidade quer comprar exatamente o que você vende. Você vai saber; disputar é com você.",
};

// Aplica o tema salvo antes da pintura para não piscar (FOUC) claro→escuro.
const APLICAR_TEMA = `(function(){try{var t=localStorage.getItem('tema');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: APLICAR_TEMA }} />
      </head>
      <body>
        <ThemeToggle />
        <TrpcProvider>{children}</TrpcProvider>
      </body>
    </html>
  );
}
