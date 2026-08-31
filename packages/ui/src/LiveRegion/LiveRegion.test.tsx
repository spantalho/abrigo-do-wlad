import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { LiveRegion } from ".";

describe("LiveRegion", () => {
  test("usa status para mensagens não interruptivas", () => {
    render(<LiveRegion>3 resultados encontrados</LiveRegion>);
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveAttribute("aria-atomic", "true");
  });

  test("usa alert para mensagens assertivas", () => {
    render(<LiveRegion politeness="assertive">Falha ao carregar</LiveRegion>);
    expect(screen.getByRole("alert")).toHaveAttribute("aria-live", "assertive");
  });
});
