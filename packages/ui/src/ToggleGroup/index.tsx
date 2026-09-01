import * as React from "react";

import { cn } from "../utils";
import styles from "./ToggleGroup.module.css";

type ToggleGroupSize = "sm" | "md" | "lg";
type ToggleGroupOrientation = "horizontal" | "vertical";

interface ToggleGroupCommonProps
  extends Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> {
  size?: ToggleGroupSize;
  orientation?: ToggleGroupOrientation;
  loop?: boolean;
  disabled?: boolean;
  allowEmpty?: boolean;
}

interface ToggleGroupSingleProps extends ToggleGroupCommonProps {
  type: "single";
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

interface ToggleGroupMultipleProps extends ToggleGroupCommonProps {
  type: "multiple";
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
}

export type ToggleGroupProps =
  | ToggleGroupSingleProps
  | ToggleGroupMultipleProps;

interface ToggleGroupContextValue {
  selectedValues: string[];
  size: ToggleGroupSize;
  disabled: boolean;
  toggleValue: (value: string) => void;
}

const ToggleGroupContext = React.createContext<ToggleGroupContextValue | null>(
  null,
);

export const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  (
    {
      type,
      size = "md",
      orientation = "horizontal",
      loop = true,
      disabled = false,
      allowEmpty = false,
      value: controlledValue,
      defaultValue,
      onValueChange,
      className,
      children,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const [uncontrolledValue, setUncontrolledValue] = React.useState<string[]>(
      () => {
        const initialValue = defaultValue;
        if (type === "single") {
          return typeof initialValue === "string" && initialValue
            ? [initialValue]
            : [];
        }
        return Array.isArray(initialValue) ? initialValue : [];
      },
    );

    const selectedValues = React.useMemo<string[]>(() => {
      if (controlledValue === undefined) return uncontrolledValue;
      if (type === "single") {
        return typeof controlledValue === "string" && controlledValue
          ? [controlledValue]
          : [];
      }
      return Array.isArray(controlledValue) ? controlledValue : [];
    }, [controlledValue, type, uncontrolledValue]);

    function commit(nextValues: string[]) {
      if (controlledValue === undefined) setUncontrolledValue(nextValues);
      if (type === "single") {
        const handleSingleValueChange = onValueChange as
          | ((value: string) => void)
          | undefined;
        handleSingleValueChange?.(nextValues[0] ?? "");
      } else {
        const handleMultipleValueChange = onValueChange as
          | ((value: string[]) => void)
          | undefined;
        handleMultipleValueChange?.(nextValues);
      }
    }

    function toggleValue(itemValue: string) {
      const selected = selectedValues.includes(itemValue);

      if (type === "single") {
        if (selected && !allowEmpty) return;
        commit(selected ? [] : [itemValue]);
        return;
      }

      if (selected && selectedValues.length === 1 && !allowEmpty) return;
      commit(
        selected
          ? selectedValues.filter(value => value !== itemValue)
          : [...selectedValues, itemValue],
      );
    }

    function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;

      const previousKey = orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";
      const nextKey = orientation === "horizontal" ? "ArrowRight" : "ArrowDown";
      if (event.key !== previousKey && event.key !== nextKey) return;

      const buttons = Array.from(
        event.currentTarget.querySelectorAll<HTMLButtonElement>(
          "[data-jaci-toggle-group-item]:not(:disabled)",
        ),
      );
      const currentIndex = buttons.indexOf(document.activeElement as HTMLButtonElement);
      if (currentIndex < 0 || buttons.length === 0) return;

      event.preventDefault();
      const direction = event.key === nextKey ? 1 : -1;
      let nextIndex = currentIndex + direction;

      if (loop) {
        nextIndex = (nextIndex + buttons.length) % buttons.length;
      } else {
        nextIndex = Math.min(Math.max(nextIndex, 0), buttons.length - 1);
      }

      buttons[nextIndex]?.focus();
    }

    return (
      <ToggleGroupContext.Provider
        value={{ selectedValues, size, disabled, toggleValue }}
      >
        <div
          {...props}
          ref={ref}
          role="group"
          className={cn(styles.root, styles[orientation], className)}
          data-size={size}
          data-orientation={orientation}
          onKeyDown={handleKeyDown}
        >
          {children}
        </div>
      </ToggleGroupContext.Provider>
    );
  },
);
ToggleGroup.displayName = "ToggleGroup";

export interface ToggleGroupItemProps
  extends Omit<React.ComponentProps<"button">, "value"> {
  value: string;
}

export const ToggleGroupItem = React.forwardRef<
  HTMLButtonElement,
  ToggleGroupItemProps
>(({ value, className, children, disabled, onClick, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext);
  if (!context) {
    throw new Error("ToggleGroupItem deve ser usado dentro de ToggleGroup.");
  }

  const selected = context.selectedValues.includes(value);
  const isDisabled = context.disabled || disabled;

  return (
    <button
      {...props}
      ref={ref}
      type="button"
      aria-pressed={selected}
      disabled={isDisabled}
      data-jaci-toggle-group-item=""
      data-state={selected ? "on" : "off"}
      data-size={context.size}
      className={cn(styles.item, className)}
      onClick={event => {
        onClick?.(event);
        if (!event.defaultPrevented) context.toggleValue(value);
      }}
    >
      {children}
    </button>
  );
});
ToggleGroupItem.displayName = "ToggleGroupItem";
