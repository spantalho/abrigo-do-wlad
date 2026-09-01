import { describe, expect, test } from "vitest";

import { getThirdPartyImage } from "./common";

describe("getThirdPartyImage", () => {
  test("resolve caminhos aninhados do catálogo de imagens", () => {
    const image = getThirdPartyImage("recycle.petBottle", {
      w: 800,
      h: 400,
      q: 75,
      crop: "center",
    });

    expect(image).toMatchObject({
      photoId: "1616118132534-381148898bb4",
      author: {
        name: "charlesdeluvio",
        profileUrl: "https://unsplash.com/pt-br/@charlesdeluvio",
      },
    });
    expect(image?.url).toBe(
      "https://images.unsplash.com/photo-1616118132534-381148898bb4?auto=format&fit=crop&w=800&h=400&q=75&crop=center",
    );
  });

  test("omite parâmetros de imagem não definidos", () => {
    expect(getThirdPartyImage("recycle.banner")?.url).not.toContain("undefined");
  });
});
