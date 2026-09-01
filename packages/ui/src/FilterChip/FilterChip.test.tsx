import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { FilterChip } from ".";

describe("FilterChip", () => {
  test("expõe uma ação acessível para remover o filtro", () => {
    const onRemove = vi.fn();
    render(
      <FilterChip onRemove={onRemove} removeLabel="Remover filtro Zona Sul">
        Zona Sul
      </FilterChip>,
    );

    const chip = screen.getByRole("button", {
      name: "Remover filtro Zona Sul",
    });
    expect(chip).toHaveTextContent("Zona Sul");
    fireEvent.click(chip);
    expect(onRemove).toHaveBeenCalledOnce();
  });
});
