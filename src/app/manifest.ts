import type { MetadataRoute } from "next";
import { SITE } from "@/src/shared/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.nome,
    short_name: SITE.nome,
    description: SITE.descricao,
    start_url: "/",
    display: "standalone",
    background_color: "#fbfaf7",
    theme_color: "#1f6f43",
    lang: SITE.idioma,
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
