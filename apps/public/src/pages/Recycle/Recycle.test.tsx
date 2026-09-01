import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { RecyclePoint } from "../../types/recycle";
import Recycle from ".";

const { getRecyclePointsMock, trackNoResultsMock } = vi.hoisted(() => ({
  getRecyclePointsMock: vi.fn(),
  trackNoResultsMock: vi.fn(),
}));

vi.mock("../../services/recycleService", () => ({
  getRecyclePoints: getRecyclePointsMock,
}));

vi.mock("@/components/Banner", () => ({
  default: () => <div data-testid="banner" />,
}));

vi.mock("@/components/PageFeedback", () => ({
  PageFeedback: () => null,
}));

vi.mock("@/components/ScrollIndicators", () => ({
  ScrollIndicators: () => null,
}));

vi.mock("@/utils/analytics", () => ({
  analytics: { trackNoResults: trackNoResultsMock },
}));

vi.mock("@/utils/common", () => ({
  getThirdPartyImage: () => ({ url: "https://example.com/recycle.jpg" }),
}));

const points: RecyclePoint[] = [
  {
    id: "morumbi",
    zone: "Zona Oeste",
    neighborhood: "Morumbi",
    name: "Pet Shop Amigo",
    address: "Av. Giovanni Gronchi, 1234",
    googleMapsUrl: "https://maps.google.com/maps/place/morumbi",
  },
  {
    id: "vila-sonia",
    zone: "Zona Oeste",
    neighborhood: "Vila Sônia",
    name: "Clínica Popular",
    address: "Av. Professor Francisco Morato, 280",
    googleMapsUrl: "https://maps.google.com/maps/place/vila-sonia",
  },
  {
    id: "campo-limpo",
    zone: "Zona Sul",
    neighborhood: "Campo Limpo",
    name: "Mercado Campo Limpo",
    address: "Estrada do Campo Limpo, 95",
    googleMapsUrl: "https://maps.google.com/maps/place/campo-limpo",
  },
];

describe("Recycle", () => {
  beforeEach(() => {
    getRecyclePointsMock.mockReset();
    getRecyclePointsMock.mockResolvedValue(points);
    trackNoResultsMock.mockReset();
  });

  test("apresenta e navega pelos exemplos de materiais aceitos", async () => {
    render(<Recycle />);

    expect(
      screen.getByRole("heading", { name: "Tampas de garrafa PET" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/garrafas de água, refrigerante, suco/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ver material anterior" }),
    ).toBeDisabled();

    fireEvent.click(
      screen.getByRole("button", { name: "Ver próximo material" }),
    );
    expect(
      await screen.findByRole("heading", {
        name: "Tampas de higiene e limpeza",
      }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Ver Lacres de alumínio" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Lacres de alumínio" }),
    ).toBeInTheDocument();
  });

  test("pesquisa por bairro e permite remover o filtro ativo", async () => {
    render(<Recycle />);

    const search = await screen.findByRole("combobox", {
      name: "Bairro ou nome do local",
    });
    expect(
      screen.getByRole("heading", { name: "Prepare sua doação" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Se possível, lave as tampinhas e separe-as por cor/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Abrir Pet Shop Amigo no Google Maps" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Abrir Mercado Campo Limpo no Google Maps" }),
    ).toBeInTheDocument();

    fireEvent.change(search, { target: { value: "campo limpo" } });

    expect(
      screen.getByRole("link", { name: "Abrir Mercado Campo Limpo no Google Maps" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Abrir Pet Shop Amigo no Google Maps" }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("1 ponto encontrado").length).toBeGreaterThan(0);

    fireEvent.click(
      screen.getByRole("button", { name: "Remover busca campo limpo" }),
    );
    expect(
      screen.getByRole("link", { name: "Abrir Pet Shop Amigo no Google Maps" }),
    ).toBeInTheDocument();
  });

  test("combina a zona selecionada com a busca textual", async () => {
    render(<Recycle />);

    const search = await screen.findByRole("combobox", {
      name: "Bairro ou nome do local",
    });
    fireEvent.click(screen.getByRole("button", { name: "Zona Oeste" }));

    expect(
      screen.getByRole("link", { name: "Abrir Pet Shop Amigo no Google Maps" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Abrir Mercado Campo Limpo no Google Maps" }),
    ).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: "endereço inexistente" } });
    expect(
      screen.getByRole("heading", { name: "Nenhum ponto encontrado" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(
      screen.getByRole("link", { name: "Abrir Mercado Campo Limpo no Google Maps" }),
    ).toBeInTheDocument();
  });

  test("revela mais pontos progressivamente", async () => {
    const manyPoints = Array.from({ length: 9 }, (_, index): RecyclePoint => ({
      id: `point-${index}`,
      zone: "Zona Sul",
      neighborhood: `Bairro ${index + 1}`,
      name: `Local ${index + 1}`,
      address: `Rua ${index + 1}`,
      googleMapsUrl: `https://maps.google.com/maps/place/point-${index}`,
    }));
    getRecyclePointsMock.mockResolvedValue(manyPoints);

    render(<Recycle />);
    await waitFor(() => {
      expect(screen.getAllByRole("link", { name: /no Google Maps/ })).toHaveLength(8);
    });

    fireEvent.click(screen.getByRole("button", { name: "Mostrar mais pontos" }));
    expect(screen.getAllByRole("link", { name: /no Google Maps/ })).toHaveLength(9);
    expect(
      screen.queryByRole("button", { name: "Mostrar mais pontos" }),
    ).not.toBeInTheDocument();
  });
});
