import type { HTMLAttributes, ReactNode } from "react";
import { Check } from "lucide-react";
import { Badge } from "../Badge";
import { Button } from "../Button";
import * as TooltipComponent from "../Tooltip";
import { cn } from "../utils";
import styles from "./Stepper.module.css";

export interface StepperItem {
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  completed?: boolean;
}

interface StepperProgress {
  label: string;
  value: number;
  valueLabel?: string;
}

interface StepperProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  steps: StepperItem[];
  activeStep: number;
  onStepChange: (step: number) => void;
  progress?: StepperProgress;
  navigationLabel?: string;
  size?: "sm" | "md";
  panelClassName?: string;
}

/**
 * Controlled navigation for multi-section flows. Locking and completion rules
 * stay with the consumer so the same component can serve forms and reviews.
 */
export function Stepper({
  steps,
  activeStep,
  onStepChange,
  progress,
  navigationLabel = "Etapas",
  size = "md",
  panelClassName,
  className,
  children,
  ...props
}: StepperProps) {
  const safeActiveStep = Math.min(Math.max(activeStep, 0), Math.max(steps.length - 1, 0));
  const activeItem = steps[safeActiveStep];
  const progressValue = progress ? Math.min(Math.max(progress.value, 0), 100) : 0;

  if (!activeItem) return null;

  return (
    <div className={cn(styles.stepper, size === "sm" && styles.sm, className)} {...props}>
      <header className={styles.header}>
        <div className={styles.currentTitle}>
          <Badge variant="secondary" size="lg" leftIcon={activeItem.icon}>
            {activeItem.label}
          </Badge>
        </div>

        {progress && (
          <div className={styles.progressSection}>
            <div className={styles.progressInfo}>
              <span>{progress.label}</span>
              <span>{progress.valueLabel ?? `${Math.round(progressValue)}%`}</span>
            </div>
            <div
              className={styles.progressTrack}
              role="progressbar"
              aria-label={progress.label}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progressValue)}
            >
              <div className={styles.progressFill} style={{ width: `${progressValue}%` }} />
            </div>
          </div>
        )}

        <nav className={styles.indicators} aria-label={navigationLabel}>
          {steps.map((step, index) => (
            <TooltipComponent.TooltipProvider key={`${step.label}-${index}`}>
              <TooltipComponent.Tooltip>
                <TooltipComponent.TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant={
                      index === safeActiveStep
                        ? "secondary"
                        : step.completed
                          ? "success"
                          : "outline"
                    }
                    className={cn(
                      styles.indicator,
                      index === safeActiveStep && styles.activeIndicator,
                    )}
                    onClick={() => onStepChange(index)}
                    disabled={step.disabled}
                    aria-current={index === safeActiveStep ? "step" : undefined}
                    aria-label={`${index + 1}. ${step.label}`}
                  >
                    {step.completed ? <Check size={18} /> : index + 1}
                  </Button>
                </TooltipComponent.TooltipTrigger>
                <TooltipComponent.TooltipContent side="bottom">
                  <p>{step.label}</p>
                </TooltipComponent.TooltipContent>
              </TooltipComponent.Tooltip>
            </TooltipComponent.TooltipProvider>
          ))}
        </nav>
      </header>

      <section
        key={safeActiveStep}
        className={cn(styles.panel, panelClassName)}
        aria-label={activeItem.label}
      >
        {children}
      </section>
    </div>
  );
}
