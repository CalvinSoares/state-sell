import { gerarImagemSocial, ogAlt, ogContentType, ogSize } from "./_lib/imagem-social";

export const alt = ogAlt;
export const size = ogSize;
export const contentType = ogContentType;

export default function OpenGraphImage() {
  return gerarImagemSocial();
}
