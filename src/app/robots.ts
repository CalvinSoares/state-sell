import type { MetadataRoute } from "next";
import { urlAbsoluta, urlDoSite } from "@/src/shared/config/site";

/** /robots.txt — indexa só o que é público e útil; bloqueia área logada, admin e APIs. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/painel",
          "/painel/",
          "/api/",
          "/verificar",
          "/feedback",
          "/pronto",
        ],
      },
    ],
    sitemap: urlAbsoluta("/sitemap.xml"),
    host: urlDoSite(),
  };
}
