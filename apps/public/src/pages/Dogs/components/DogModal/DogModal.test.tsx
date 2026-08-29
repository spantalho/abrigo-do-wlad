import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Dog } from "@/types/dogs";
import { shareDogProfile } from "@/utils/shareDog";
import { DogModal } from ".";

vi.mock("@/hooks/useIsDesktop", () => ({
  useIsDesktop: () => true,
}));

vi.mock("@/utils/shareDog", () => ({
  shareDogProfile: vi.fn(),
}));

vi.mock("@/utils/analytics", () => ({
  analytics: {
    trackButtonClick: vi.fn(),
    trackConversionIntent: vi.fn(),
  },
}));

const dog: Dog = {
  id: "dog-1",
  publicSlug: "pacoca",
  nome: "Paçoca",
  idade: "2 anos",
  cateIdade: "adulto",
  sexo: "Macho",
  temperamento: "Dócil",
  tags: ["dócil"],
  status: "Vacinado e Castrado",
  fotos: ["https://example.com/pacoca.jpg"],
  cor: "caramelo",
};

describe("DogModal sharing", () => {
  beforeEach(() => {
    vi.mocked(shareDogProfile).mockResolvedValue("copied");
  });

  it("shares the selected dog and confirms the copied-link fallback", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <DogModal dog={dog} isOpen onClose={vi.fn()} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Compartilhar" }));

    expect(shareDogProfile).toHaveBeenCalledWith(dog);
    expect(await screen.findByText("Link copiado!")).toBeInTheDocument();
  });
});
