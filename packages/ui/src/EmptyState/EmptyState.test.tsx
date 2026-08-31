import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { EmptyState } from ".";

describe("EmptyState", () => {
  test("mantém a hierarquia de título configurável", () => {
    render(
      <EmptyState
        headingLevel={2}
        title="Nenhum resultado"
        description="Tente remover os filtros."
        actions={<button type="button">Limpar filtros</button>}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Nenhum resultado" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Tente remover os filtros.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Limpar filtros" }),
    ).toBeInTheDocument();
  });
});
