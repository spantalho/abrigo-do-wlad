import * as React from "react";

export interface FieldContextValue {
  name: string;
  labelId: string;
  errorId: string;
  error?: string;
}

export const FieldContext = React.createContext<FieldContextValue | null>(null);

export function useFieldContext(): FieldContextValue {
  const field = React.useContext(FieldContext);

  if (!field) {
    throw new Error("Controles de campo devem estar dentro de FieldWrapper");
  }

  return field;
}
