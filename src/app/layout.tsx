import type { Metadata } from "next";
import { TrpcProvider } from "@/src/shared/trpc/cliente";
import { ThemeToggle } from "@/src/shared/components/app/ThemeToggle";
import { SITE, urlDoSite } from "@/src/shared/config/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(urlDoSite()),
  title: {
    default: SITE.tituloPadrao,
    template: `%s · ${SITE.nome}`,
  },
  description: SITE.descricao,
  applicationName: SITE.nome,
  authors: [{ name: SITE.nome, url: urlDoSite() }],
  creator: SITE.nome,
  publisher: SITE.nome,
  category: "negócios",
  keywords: [
    "prefeitura",
    "compras públicas",
    "aviso de compra",
    "microempresa",
    "pequeno negócio",
    "MEI",
    "oportunidade",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: SITE.locale,
    url: "/",
    siteName: SITE.nome,
    title: SITE.tituloPadrao,
    description: SITE.descricao,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.tituloPadrao,
    description: SITE.descricao,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

// Aplica o tema salvo antes da pintura para não piscar (FOUC) claro→escuro.
const APLICAR_TEMA = `(function(){try{var t=localStorage.getItem('tema');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={SITE.idioma} suppressHydrationWarning>
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
