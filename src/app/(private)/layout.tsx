import type { Metadata } from "next";

/** Área do assinante — nunca indexar. */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
