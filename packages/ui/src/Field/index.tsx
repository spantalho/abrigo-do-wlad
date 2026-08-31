import * as React from "react";

import { cn } from "../utils";
import styles from "./Field.module.css";

export type FieldControlSize = "sm" | "md" | "lg";

interface FieldContextValue {
  controlId: string;
  descriptionId?: string;
  errorId?: string;
  invalid: boolean;
  required: boolean;
  size: FieldControlSize;
}

const FieldContext = React.createContext<FieldContextValue | null>(null);

export interface FieldProps extends Omit<React.ComponentProps<"div">, "id"> {
  controlId: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  size?: FieldControlSize;
}

export const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  (
    {
      controlId,
      label,
      description,
      error,
      required = false,
      size = "md",
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const descriptionId = description ? `${controlId}-description` : undefined;
    const errorId = error ? `${controlId}-error` : undefined;
    const invalid = Boolean(error);

    return (
      <FieldContext.Provider
        value={{
          controlId,
          descriptionId,
          errorId,
          invalid,
          required,
          size,
        }}
      >
        <div ref={ref} className={cn(styles.field, className)} {...props}>
          <label className={styles.label} htmlFor={controlId}>
            {label}
            {required && (
              <span className={styles.required} aria-hidden="true">
                *
              </span>
            )}
          </label>
          {children}
          {description && (
            <div id={descriptionId} className={styles.description}>
              {description}
            </div>
          )}
          {error && (
            <div id={errorId} className={styles.error} role="alert">
              {error}
            </div>
          )}
        </div>
      </FieldContext.Provider>
    );
  },
);
Field.displayName = "Field";

function mergeIds(...ids: Array<string | undefined>) {
  const mergedIds = Array.from(
    new Set(ids.flatMap(id => id?.split(/\s+/).filter(Boolean) ?? [])),
  );

  return mergedIds.length > 0 ? mergedIds.join(" ") : undefined;
}

function useFieldControl(
  props: {
    id?: string;
    required?: boolean;
    "aria-describedby"?: string;
    "aria-invalid"?: React.AriaAttributes["aria-invalid"];
  },
  size?: FieldControlSize,
) {
  const field = React.useContext(FieldContext);

  return {
    id: props.id ?? field?.controlId,
    required: props.required ?? field?.required,
    "aria-describedby": mergeIds(
      props["aria-describedby"],
      field?.descriptionId,
      field?.errorId,
    ),
    "aria-invalid": props["aria-invalid"] ?? (field?.invalid || undefined),
    size: size ?? field?.size ?? "md",
  };
}

export type InputProps = Omit<React.ComponentProps<"input">, "size"> & {
  size?: FieldControlSize;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      size,
      id,
      required,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      ...props
    },
    ref,
  ) => {
    const fieldControl = useFieldControl(
      {
        id,
        required,
        "aria-describedby": ariaDescribedBy,
        "aria-invalid": ariaInvalid,
      },
      size,
    );

    return (
      <input
        ref={ref}
        className={cn(styles.control, styles[fieldControl.size], className)}
        data-size={fieldControl.size}
        {...props}
        id={fieldControl.id}
        required={fieldControl.required}
        aria-describedby={fieldControl["aria-describedby"]}
        aria-invalid={fieldControl["aria-invalid"]}
      />
    );
  },
);
Input.displayName = "Input";

export type NativeSelectProps = Omit<React.ComponentProps<"select">, "size"> & {
  size?: FieldControlSize;
};

export const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  (
    {
      className,
      size,
      id,
      required,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      ...props
    },
    ref,
  ) => {
    const fieldControl = useFieldControl(
      {
        id,
        required,
        "aria-describedby": ariaDescribedBy,
        "aria-invalid": ariaInvalid,
      },
      size,
    );

    return (
      <select
        ref={ref}
        className={cn(
          styles.control,
          styles.select,
          styles[fieldControl.size],
          className,
        )}
        data-size={fieldControl.size}
        {...props}
        id={fieldControl.id}
        required={fieldControl.required}
        aria-describedby={fieldControl["aria-describedby"]}
        aria-invalid={fieldControl["aria-invalid"]}
      />
    );
  },
);
NativeSelect.displayName = "NativeSelect";

export type TextareaProps = React.ComponentProps<"textarea"> & {
  size?: FieldControlSize;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      size,
      id,
      required,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      ...props
    },
    ref,
  ) => {
    const fieldControl = useFieldControl(
      {
        id,
        required,
        "aria-describedby": ariaDescribedBy,
        "aria-invalid": ariaInvalid,
      },
      size,
    );

    return (
      <textarea
        ref={ref}
        className={cn(
          styles.control,
          styles.textarea,
          styles[fieldControl.size],
          className,
        )}
        data-size={fieldControl.size}
        {...props}
        id={fieldControl.id}
        required={fieldControl.required}
        aria-describedby={fieldControl["aria-describedby"]}
        aria-invalid={fieldControl["aria-invalid"]}
      />
    );
  },
);
Textarea.displayName = "Textarea";
