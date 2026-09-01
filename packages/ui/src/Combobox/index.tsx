import * as React from "react";

import { ScrollArea } from "../ScrollArea";
import { SearchField, type SearchFieldProps } from "../SearchField";
import { cn } from "../utils";
import styles from "./Combobox.module.css";

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
  keywords?: string[];
  disabled?: boolean;
}

export interface ComboboxProps
  extends Omit<
    SearchFieldProps,
    | "value"
    | "defaultValue"
    | "onValueChange"
    | "onClear"
    | "role"
    | "aria-expanded"
    | "aria-controls"
    | "aria-activedescendant"
    | "aria-autocomplete"
  > {
  options: ComboboxOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onOptionSelect?: (option: ComboboxOption) => void;
  onClear?: () => void;
  filterOption?: (option: ComboboxOption, query: string) => boolean;
  emptyMessage?: React.ReactNode;
  showAllOnFocus?: boolean;
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
}

function defaultFilterOption(option: ComboboxOption, query: string) {
  const normalizedQuery = normalize(query.trim());
  if (!normalizedQuery) return true;

  return normalize(
    [option.label, option.description, option.value, ...(option.keywords ?? [])]
      .filter(Boolean)
      .join(" "),
  ).includes(normalizedQuery);
}

function firstEnabledIndex(options: ComboboxOption[]) {
  return options.findIndex(option => !option.disabled);
}

export const Combobox = React.forwardRef<HTMLInputElement, ComboboxProps>(
  (
    {
      options,
      value,
      defaultValue = "",
      onValueChange,
      onOptionSelect,
      onClear,
      filterOption = defaultFilterOption,
      emptyMessage = "Nenhuma opção encontrada.",
      showAllOnFocus = true,
      disabled,
      className,
      onFocus,
      onBlur,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const listboxId = `${generatedId}-listbox`;
    const listboxRef = React.useRef<HTMLUListElement>(null);
    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
    const [open, setOpen] = React.useState(false);
    const [activeIndex, setActiveIndex] = React.useState(-1);
    const currentValue = value ?? uncontrolledValue;

    const filteredOptions = React.useMemo(
      () => options.filter(option => filterOption(option, currentValue)),
      [currentValue, filterOption, options],
    );

    const activeOption = filteredOptions[activeIndex];
    const activeOptionId = activeOption
      ? `${generatedId}-option-${activeIndex}`
      : undefined;
    const scrollAreaHeight = React.useMemo(() => {
      if (filteredOptions.length === 0) return "3.5rem";

      const contentHeight = filteredOptions.reduce(
        (height, option) => height + (option.description ? 3.75 : 2.8),
        0.8,
      );

      return `${Math.min(contentHeight, 18)}rem`;
    }, [filteredOptions]);

    React.useLayoutEffect(() => {
      if (!open || activeIndex < 0) return;

      listboxRef.current
        ?.querySelector<HTMLElement>(`[data-option-index="${activeIndex}"]`)
        ?.scrollIntoView({ block: "nearest" });
    }, [activeIndex, open]);

    function updateValue(nextValue: string) {
      if (value === undefined) setUncontrolledValue(nextValue);
      onValueChange?.(nextValue);
    }

    function openList(nextOptions = filteredOptions) {
      setOpen(true);
      setActiveIndex(firstEnabledIndex(nextOptions));
    }

    function selectOption(option: ComboboxOption) {
      if (option.disabled) return;
      updateValue(option.label);
      onOptionSelect?.(option);
      setOpen(false);
      setActiveIndex(-1);
    }

    function moveActiveIndex(direction: 1 | -1) {
      if (filteredOptions.length === 0) return;

      let nextIndex = activeIndex;
      for (let attempts = 0; attempts < filteredOptions.length; attempts += 1) {
        nextIndex =
          (nextIndex + direction + filteredOptions.length) %
          filteredOptions.length;
        if (!filteredOptions[nextIndex]?.disabled) {
          setActiveIndex(nextIndex);
          return;
        }
      }
    }

    function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (!open) {
          openList();
        } else {
          moveActiveIndex(event.key === "ArrowDown" ? 1 : -1);
        }
        return;
      }

      if (event.key === "Enter" && open && activeOption) {
        event.preventDefault();
        selectOption(activeOption);
        return;
      }

      if (event.key === "Escape" && open) {
        event.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
      }
    }

    return (
      <div className={cn(styles.root, className)}>
        <SearchField
          {...props}
          ref={ref}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={open ? activeOptionId : undefined}
          disabled={disabled}
          value={currentValue}
          onValueChange={nextValue => {
            updateValue(nextValue);
            const nextOptions = options.filter(option =>
              filterOption(option, nextValue),
            );
            openList(nextOptions);
          }}
          onClear={() => {
            onClear?.();
            const nextOptions = options.filter(option => filterOption(option, ""));
            openList(nextOptions);
          }}
          onFocus={event => {
            onFocus?.(event);
            if (!event.defaultPrevented && showAllOnFocus) openList();
          }}
          onBlur={event => {
            onBlur?.(event);
            if (!event.defaultPrevented) {
              setOpen(false);
              setActiveIndex(-1);
            }
          }}
          onKeyDown={handleKeyDown}
        />

        {open && !disabled && (
          <div className={styles.popup}>
            <ScrollArea
              className={styles.scrollArea}
              style={{ height: scrollAreaHeight }}
              showScrollShadows
            >
              <ul
                ref={listboxRef}
                id={listboxId}
                role="listbox"
                className={styles.listbox}
              >
                {filteredOptions.length === 0 ? (
                  <li className={styles.empty}>{emptyMessage}</li>
                ) : (
                  filteredOptions.map((option, index) => (
                    <li
                      id={`${generatedId}-option-${index}`}
                      key={option.value}
                      role="option"
                      aria-selected={index === activeIndex}
                      aria-disabled={option.disabled || undefined}
                      className={styles.option}
                      data-option-index={index}
                      data-highlighted={index === activeIndex ? "" : undefined}
                      data-disabled={option.disabled ? "" : undefined}
                      onMouseMove={() => {
                        if (!option.disabled) setActiveIndex(index);
                      }}
                      onMouseDown={event => {
                        event.preventDefault();
                        selectOption(option);
                      }}
                    >
                      <span className={styles.optionLabel}>{option.label}</span>
                      {option.description && (
                        <span className={styles.optionDescription}>
                          {option.description}
                        </span>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </ScrollArea>
          </div>
        )}
      </div>
    );
  },
);
Combobox.displayName = "Combobox";
