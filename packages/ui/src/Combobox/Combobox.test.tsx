import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { Combobox, type ComboboxOption } from ".";

const options: ComboboxOption[] = [
  { value: "morumbi", label: "Morumbi", description: "Bairro" },
  { value: "vila-sonia", label: "Vila Sônia", description: "Bairro · Zona Oeste" },
  { value: "campo-limpo", label: "Campo Limpo", description: "Bairro · Zona Sul" },
];

describe("Combobox", () => {
  test("filtra sem distinguir acentos e seleciona pelo teclado", () => {
    const onOptionSelect = vi.fn();
    render(
      <Combobox
        aria-label="Buscar bairro"
        options={options}
        onOptionSelect={onOptionSelect}
      />,
    );

    const input = screen.getByRole("combobox", { name: "Buscar bairro" });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "sonia" } });

    expect(screen.getByRole("option", { name: /Vila Sônia/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Morumbi/ })).not.toBeInTheDocument();

    fireEvent.keyDown(input, { key: "Enter" });
    expect(input).toHaveValue("Vila Sônia");
    expect(onOptionSelect).toHaveBeenCalledWith(options[1]);
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  test("informa quando não há opções correspondentes", () => {
    const { container } = render(
      <Combobox aria-label="Buscar bairro" options={options} />,
    );
    const input = screen.getByRole("combobox", { name: "Buscar bairro" });
    fireEvent.change(input, { target: { value: "inexistente" } });

    expect(screen.getByText("Nenhuma opção encontrada.")).toBeInTheDocument();
    expect(
      container.querySelector("[data-radix-scroll-area-viewport]")
        ?.parentElement,
    ).toHaveStyle({ height: "5.5rem" });
  });

  test("permite selecionar e remover múltiplas opções", () => {
    const onSelectedValuesChange = vi.fn();
    render(
      <Combobox
        multiple
        aria-label="Buscar bairros"
        options={options}
        onSelectedValuesChange={onSelectedValuesChange}
      />,
    );

    const input = screen.getByRole("combobox", { name: "Buscar bairros" });
    fireEvent.focus(input);

    const morumbi = screen.getByRole("option", { name: /Morumbi/ });
    fireEvent.mouseDown(morumbi);
    expect(onSelectedValuesChange).toHaveBeenLastCalledWith(["morumbi"]);
    expect(morumbi).toHaveAttribute("aria-selected", "true");
    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("aria-expanded", "true");

    fireEvent.mouseDown(morumbi);
    expect(onSelectedValuesChange).toHaveBeenLastCalledWith([]);
    expect(morumbi).toHaveAttribute("aria-selected", "false");
  });

  test("usa o ScrollArea e mantém a opção ativa visível pelo teclado", async () => {
    const scrollIntoView = vi.spyOn(Element.prototype, "scrollIntoView");
    const manyOptions = Array.from({ length: 12 }, (_, index) => ({
      value: `option-${index}`,
      label: `Opção ${index + 1}`,
      description: "Bairro",
    }));
    const { container } = render(
      <Combobox aria-label="Buscar opção" options={manyOptions} />,
    );

    const input = screen.getByRole("combobox", { name: "Buscar opção" });
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: "ArrowDown" });

    expect(
      container.querySelector("[data-radix-scroll-area-viewport]"),
    ).toBeInTheDocument();
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
  });
});
