import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { ToggleGroup, ToggleGroupItem } from ".";

describe("ToggleGroup", () => {
  test("mantém uma opção selecionada no modo single", () => {
    const onValueChange = vi.fn();
    render(
      <ToggleGroup
        type="single"
        defaultValue="all"
        onValueChange={onValueChange}
        aria-label="Zona"
      >
        <ToggleGroupItem value="all">Todas</ToggleGroupItem>
        <ToggleGroupItem value="south">Sul</ToggleGroupItem>
      </ToggleGroup>,
    );

    const all = screen.getByRole("button", { name: "Todas" });
    const south = screen.getByRole("button", { name: "Sul" });
    expect(screen.getByRole("group", { name: "Zona" })).not.toHaveAttribute(
      "value",
    );
    expect(all).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(south);
    expect(south).toHaveAttribute("aria-pressed", "true");
    expect(all).toHaveAttribute("aria-pressed", "false");
    expect(onValueChange).toHaveBeenLastCalledWith("south");

    fireEvent.click(south);
    expect(south).toHaveAttribute("aria-pressed", "true");
  });

  test("move o foco com as setas", () => {
    render(
      <ToggleGroup type="single" aria-label="Zona">
        <ToggleGroupItem value="north">Norte</ToggleGroupItem>
        <ToggleGroupItem value="south">Sul</ToggleGroupItem>
      </ToggleGroup>,
    );

    const north = screen.getByRole("button", { name: "Norte" });
    const south = screen.getByRole("button", { name: "Sul" });
    north.focus();
    fireEvent.keyDown(north, { key: "ArrowRight" });
    expect(south).toHaveFocus();
  });
});
