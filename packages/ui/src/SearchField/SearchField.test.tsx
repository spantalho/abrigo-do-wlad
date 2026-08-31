import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { SearchField } from ".";

describe("SearchField", () => {
  test("atualiza a busca e permite limpá-la preservando o foco", () => {
    const onValueChange = vi.fn();
    const onClear = vi.fn();

    render(
      <SearchField
        aria-label="Buscar animais"
        defaultValue="Jaci"
        onValueChange={onValueChange}
        onClear={onClear}
      />,
    );

    const input = screen.getByRole("searchbox", { name: "Buscar animais" });
    fireEvent.change(input, { target: { value: "Wlad" } });
    expect(onValueChange).toHaveBeenLastCalledWith("Wlad");

    fireEvent.click(screen.getByRole("button", { name: "Limpar busca" }));
    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
    expect(onClear).toHaveBeenCalledOnce();
  });
});
