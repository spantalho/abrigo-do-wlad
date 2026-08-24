import { describe, expect, it } from "vitest";
import {
  getOptimizedImageUrl,
  getResponsiveImageSrcSet,
  getThumbnailUrl,
} from "./cloudinary";

const imageUrl =
  "https://res.cloudinary.com/abrigo/image/upload/v123/cachorros/flor.jpg";

describe("Cloudinary image helpers", () => {
  it("preserva URLs externas", () => {
    const externalUrl = "https://example.com/dog.jpg";

    expect(getOptimizedImageUrl(externalUrl, { width: 320 })).toBe(externalUrl);
    expect(getResponsiveImageSrcSet(externalUrl, [320, 640])).toBe("");
  });

  it("adiciona transformações e usa qualidade automática por padrão", () => {
    expect(
      getOptimizedImageUrl(imageUrl, {
        width: 320,
        height: 350,
        crop: "fill",
        gravity: "auto",
      }),
    ).toBe(
      "https://res.cloudinary.com/abrigo/image/upload/c_fill,w_320,h_350,q_auto,f_auto,g_auto/v123/cachorros/flor.jpg",
    );
  });

  it("limita a qualidade numérica ao intervalo aceito", () => {
    expect(getThumbnailUrl(imageUrl, 128, 200)).toContain("q_100");
  });

  it("gera srcset responsivo mantendo a proporção", () => {
    const srcSet = getResponsiveImageSrcSet(imageUrl, [640, 320, 480, 320], {
      width: 320,
      height: 350,
      crop: "fill",
      gravity: "auto",
    });

    expect(srcSet).toContain("w_320,h_350");
    expect(srcSet).toContain("w_480,h_525");
    expect(srcSet).toContain("w_640,h_700");
    expect(srcSet.match(/ 320w/g)).toHaveLength(1);
  });

  it("aceita imagens ausentes", () => {
    expect(getOptimizedImageUrl(null)).toBe("");
    expect(getResponsiveImageSrcSet(undefined, [320])).toBe("");
  });
});
