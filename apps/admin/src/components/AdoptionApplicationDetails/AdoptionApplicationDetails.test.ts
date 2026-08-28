import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { stepSchemas } from "../../../../public/src/pages/BetaForm/components/WizardForm/schema";
import { ADOPTION_REVIEW_STEPS, AdoptionDetailsSection } from ".";

describe("adoption application review metadata", () => {
  test("covers every field from the public adoption form exactly once", () => {
    const formFields = stepSchemas.flatMap((schema) => Object.keys(schema.shape));
    const reviewFields = ADOPTION_REVIEW_STEPS.flatMap((step) =>
      step.fields.map((field) => field.key),
    );

    expect(new Set(reviewFields).size).toBe(reviewFields.length);
    expect(new Set(reviewFields)).toEqual(new Set(formFields));
    expect(ADOPTION_REVIEW_STEPS).toHaveLength(stepSchemas.length);
  });

  test("renders each question and answer as semantic definition data", () => {
    const step = ADOPTION_REVIEW_STEPS[0];
    const html = renderToStaticMarkup(createElement(AdoptionDetailsSection, {
      application: {
        id: "application-test",
        nome_adotante: "Lívia Martins",
      },
      step,
    }));

    expect(html).toContain("<dl");
    expect(html.match(/<dt/g)).toHaveLength(step.fields.length);
    expect(html.match(/<dd/g)).toHaveLength(step.fields.length);
    expect(html).toContain(">1.1.</span>");
    expect(html).toContain(">Nome do adotante</span>");
    expect(html).toContain(">Lívia Martins</dd>");
    expect(html).toContain(">Não informado</dd>");
  });
});
