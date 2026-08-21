import * as React from "react";

import * as RadioComponent from "@/components/ui/RadioGroup";
import * as SelectComponent from "@/components/ui/Select";

import { useFieldContext } from "./FieldContext";

export const FieldRadioGroup = React.forwardRef<
  React.ComponentRef<typeof RadioComponent.RadioGroup>,
  React.ComponentPropsWithoutRef<typeof RadioComponent.RadioGroup>
>((props, ref) => {
  const { name, labelId, errorId, error } = useFieldContext();

  return (
    <RadioComponent.RadioGroup
      {...props}
      ref={ref}
      id={name}
      aria-labelledby={labelId}
      aria-describedby={error ? errorId : undefined}
      aria-invalid={error ? true : undefined}
    />
  );
});

FieldRadioGroup.displayName = "FieldRadioGroup";

export const FieldSelectTrigger = React.forwardRef<
  React.ComponentRef<typeof SelectComponent.SelectTrigger>,
  React.ComponentPropsWithoutRef<typeof SelectComponent.SelectTrigger>
>((props, ref) => {
  const { name, labelId, errorId, error } = useFieldContext();

  return (
    <SelectComponent.SelectTrigger
      {...props}
      ref={ref}
      id={name}
      aria-labelledby={labelId}
      aria-describedby={error ? errorId : undefined}
      aria-invalid={error ? true : undefined}
    />
  );
});

FieldSelectTrigger.displayName = "FieldSelectTrigger";
