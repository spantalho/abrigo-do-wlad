import * as React from "react";
import * as RadioPrimitives from "@radix-ui/react-radio-group";
import * as Lucide from "lucide-react";

import { cn } from "../utils";
import styles from "./RadioGroup.module.css";

const RadioGroup = React.forwardRef<
  React.ComponentRef<typeof RadioPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof RadioPrimitives.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioPrimitives.Root
      className={cn(styles.root, className)}
      {...props}
      ref={ref}
    />
  );
});
RadioGroup.displayName = RadioPrimitives.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioPrimitives.Item>,
  React.ComponentPropsWithoutRef<typeof RadioPrimitives.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioPrimitives.Item
      ref={ref}
      className={cn(styles.item, className)}
      {...props}
    >
      <Lucide.Circle className={styles.uncheckedIcon} />
      <RadioPrimitives.Indicator className={styles.indicatorWrapper}>
        <Lucide.Circle className={styles.indicatorIcon} />
      </RadioPrimitives.Indicator>
    </RadioPrimitives.Item>
  );
});
RadioGroupItem.displayName = RadioPrimitives.Item.displayName;

export { RadioGroup, RadioGroupItem };
