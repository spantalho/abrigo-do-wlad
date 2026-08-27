import { describe, expect, test } from "vitest";
import { stepSchemas } from "../../../../public/src/pages/BetaForm/components/WizardForm/schema";
import { ADOPTION_REVIEW_STEPS } from ".";

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
});
