import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { Field, Input } from ".";

describe("Field", () => {
  test("associa label, descrição, obrigatoriedade e erro ao input", () => {
    render(
      <Field
        controlId="dog-temperament"
        label="Temperamento"
        description="Use um resumo curto."
        error="Informe o temperamento."
        required
        size="sm"
      >
        <Input />
      </Field>,
    );

    const input = screen.getByRole("textbox", { name: "Temperamento" });

    expect(input).toBeRequired();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("data-size", "sm");
    expect(input).toHaveAccessibleDescription(
      "Use um resumo curto. Informe o temperamento.",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Informe o temperamento.",
    );
  });

  test("permite sobrescrever o tamanho herdado e preserva descrições externas", () => {
    render(
      <>
        <Field
          controlId="dog-name"
          label="Nome"
          description="Nome exibido no site."
          size="sm"
        >
          <Input size="lg" aria-describedby="external-help" />
        </Field>
        <span id="external-help">Sem apelidos.</span>
      </>,
    );

    const input = screen.getByRole("textbox", { name: "Nome" });

    expect(input).toHaveAttribute("data-size", "lg");
    expect(input).toHaveAccessibleDescription(
      "Sem apelidos. Nome exibido no site.",
    );
  });
});
