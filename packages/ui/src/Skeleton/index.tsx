import * as React from "react";

import { cn } from "../utils";
import styles from "./Skeleton.module.css";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

function Skeleton({ className, ...props }: SkeletonProps) {
  return <div className={cn(styles.skeleton, className)} {...props} />;
}

export { Skeleton }