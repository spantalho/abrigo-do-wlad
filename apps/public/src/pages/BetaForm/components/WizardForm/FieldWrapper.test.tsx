import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import * as SelectComponent from "@abrigo/ui/Select";

import { FieldRadioGroup, FieldSelectTrigger } from "./FieldControls";
import { FieldWrapper } from "./FieldWrapper";

describe("FieldWrapper", () => {
  it("associa o rótulo ao controle e identifica campos obrigatórios", () => {
    render(
      <FieldWrapper
        name="campo_teste"
        label="Campo de teste"
        required
        errors={{}}
      >
        <input id="campo_teste" />
      </FieldWrapper>,
    );

    expect(screen.getByLabelText(/Campo de teste/)).toBeInTheDocument();
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("exibe somente o erro correspondente ao campo", () => {
    const { rerender } = render(
      <FieldWrapper
        name="campo_teste"
        label="Campo de teste"
        errors={{ outro_campo: "Erro de outro campo" }}
      >
        <input id="campo_teste" />
      </FieldWrapper>,
    );

    expect(screen.queryByText("Erro de outro campo")).not.toBeInTheDocument();

    rerender(
      <FieldWrapper
        name="campo_teste"
        label="Campo de teste"
        errors={{ campo_teste: "Preencha este campo" }}
      >
        <input id="campo_teste" />
      </FieldWrapper>,
    );

    expect(screen.getByText("Preencha este campo")).toBeInTheDocument();
  });

  it("conecta perguntas e erros aos controles compostos", () => {
    render(
      <>
        <FieldWrapper
          name="escolha"
          label="Escolha uma opção"
          errors={{ escolha: "Escolha obrigatória" }}
        >
          <FieldRadioGroup />
        </FieldWrapper>

        <FieldWrapper
          name="selecao"
          label="Selecione uma categoria"
          errors={{ selecao: "Categoria obrigatória" }}
        >
          <SelectComponent.Select>
            <FieldSelectTrigger>
              <SelectComponent.SelectValue placeholder="Selecione" />
            </FieldSelectTrigger>
          </SelectComponent.Select>
        </FieldWrapper>
      </>,
    );

    const radioGroup = screen.getByRole("radiogroup", {
      name: "Escolha uma opção",
    });
    const select = screen.getByRole("combobox", {
      name: "Selecione uma categoria",
    });

    expect(radioGroup).toHaveAttribute("aria-invalid", "true");
    expect(radioGroup).toHaveAccessibleDescription("Escolha obrigatória");
    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(select).toHaveAccessibleDescription("Categoria obrigatória");
  });
});
