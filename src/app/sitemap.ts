import type { MetadataRoute } from "next";
import { urlAbsoluta } from "@/src/shared/config/site";

/** Páginas públicas indexáveis. Áreas logadas, confirmações e APIs ficam de fora. */
export default function sitemap(): MetadataRoute.Sitemap {
  const agora = new Date();

  return [
    {
      url: urlAbsoluta("/"),
      lastModified: agora,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: urlAbsoluta("/cadastro"),
      lastModified: agora,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: urlAbsoluta("/entrar"),
      lastModified: agora,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: urlAbsoluta("/privacidade"),
      lastModified: agora,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: urlAbsoluta("/trilha"),
      lastModified: agora,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
