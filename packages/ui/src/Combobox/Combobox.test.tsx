import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { Combobox, type ComboboxOption } from ".";

const options: ComboboxOption[] = [
  { value: "aldeota", label: "Aldeota", description: "Bairro" },
  { value: "messejana", label: "Messejana", description: "Bairro · Zona Sul" },
  { value: "benfica", label: "Benfica", description: "Bairro · Zona Central" },
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
    fireEvent.change(input, { target: { value: "messe" } });

    expect(screen.getByRole("option", { name: /Messejana/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Aldeota/ })).not.toBeInTheDocument();

    fireEvent.keyDown(input, { key: "Enter" });
    expect(input).toHaveValue("Messejana");
    expect(onOptionSelect).toHaveBeenCalledWith(options[1]);
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  test("informa quando não há opções correspondentes", () => {
    render(<Combobox aria-label="Buscar bairro" options={options} />);
    const input = screen.getByRole("combobox", { name: "Buscar bairro" });
    fireEvent.change(input, { target: { value: "inexistente" } });
    expect(screen.getByText("Nenhuma opção encontrada.")).toBeInTheDocument();
  });
});
