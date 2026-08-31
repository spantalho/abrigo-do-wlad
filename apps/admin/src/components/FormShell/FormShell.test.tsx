import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, test } from "vitest";
import { FormShell } from ".";

function renderShell(isDirty: boolean) {
  render(
    <MemoryRouter initialEntries={["/form"]}>
      <Routes>
        <Route
          path="/form"
          element={(
            <FormShell
              title="Editar cadastro"
              backTo="/list"
              isDirty={isDirty}
              isSubmitting={false}
              submitLabel="Salvar"
              onSubmit={event => event.preventDefault()}
            >
              <p>Conteúdo do formulário</p>
            </FormShell>
          )}
        />
        <Route path="/list" element={<p>Lista de cadastros</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("FormShell", () => {
  test("navigates back immediately when there are no pending changes", async () => {
    const user = userEvent.setup();
    renderShell(false);

    await user.click(screen.getByRole("button", { name: "Voltar" }));

    expect(screen.getByText("Lista de cadastros")).toBeTruthy();
  });

  test("keeps editing or discards pending changes from the confirmation dialog", async () => {
    const user = userEvent.setup();
    renderShell(true);

    await user.click(screen.getByRole("button", { name: "Voltar" }));
    expect(screen.getByRole("heading", { name: "Descartar alterações?" })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Voltar a editar" }));
    expect(screen.getByText("Conteúdo do formulário")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Descartar alterações?" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Voltar" }));
    await user.click(screen.getByRole("button", { name: "Descartar alterações" }));

    expect(screen.getByText("Lista de cadastros")).toBeTruthy();
  });
});
