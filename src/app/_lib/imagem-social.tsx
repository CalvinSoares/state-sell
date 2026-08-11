import { ImageResponse } from "next/og";
import { SITE } from "@/src/shared/config/site";

export const ogAlt = `${SITE.nome} — avisa quando a prefeitura quer comprar o que você vende`;
export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

/** Preview social compartilhado por opengraph-image e twitter-image. */
export function gerarImagemSocial() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(145deg, #fbfaf7 0%, #eaf4ee 55%, #d8ebe0 100%)",
          color: "#1b1a17",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            color: "#1f6f43",
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: "0.02em",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "#1f6f43",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            P
          </div>
          {SITE.nome}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 980 }}>
          <div style={{ fontSize: 58, fontWeight: 700, lineHeight: 1.12, letterSpacing: "-0.02em" }}>
            A prefeitura da sua cidade quer comprar o que você vende.
          </div>
          <div style={{ fontSize: 28, color: "#5f5e57", lineHeight: 1.35, maxWidth: 860 }}>
            A gente avisa quando aparecer algo que serve. Você vai saber; disputar é com você.
          </div>
        </div>

        <div style={{ display: "flex", color: "#185737", fontSize: 22, fontWeight: 600 }}>
          prefeitura-quer.vercel.app
        </div>
      </div>
    ),
    { ...ogSize },
  );
}
