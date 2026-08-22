import * as React from "react";
import * as LabelPrimitives from "@radix-ui/react-label";

import { cn } from "../utils";
import styles from "./Label.module.css";

const Label = React.forwardRef<
  React.ComponentRef<typeof LabelPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitives.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitives.Root
    ref={ref}
    className={cn(styles.root, className)}
    {...props}
  />
));
Label.displayName = LabelPrimitives.Root.displayName;

export { Label };
