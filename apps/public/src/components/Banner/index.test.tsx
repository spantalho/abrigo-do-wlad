import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Banner from ".";

const cloudinaryImage =
  "https://res.cloudinary.com/abrigo/image/upload/v123/cachorros/flor.jpg";

describe("Banner", () => {
  it("entrega recortes do Cloudinary adequados para desktop e mobile", () => {
    const { container } = render(
      <Banner
        image={cloudinaryImage}
        badge="Amigos Fiéis"
        title="Nossos Doguinhos"
        description="Encontre seu novo amigo."
      />,
    );

    const mobileSource = container.querySelector(
      'source[media="(max-width: 768px)"]',
    );
    const desktopImage = container.querySelector("picture img");

    expect(mobileSource?.getAttribute("srcset")).toContain("w_384,h_400");
    expect(mobileSource?.getAttribute("srcset")).toContain("w_768,h_800");
    expect(desktopImage?.getAttribute("src")).toContain("w_1920,h_800");
    expect(desktopImage?.getAttribute("srcset")).toContain("w_1280,h_533");
  });
});
