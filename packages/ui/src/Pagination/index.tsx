import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "../Button";
import { cn } from "../utils";
import styles from "./Pagination.module.css";

export interface PaginationProps
  extends Omit<React.ComponentProps<"nav">, "onChange"> {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  previousLabel?: string;
  nextLabel?: string;
  pageLabel?: (currentPage: number, totalPages: number) => React.ReactNode;
}

export const Pagination = React.forwardRef<HTMLElement, PaginationProps>(
  (
    {
      currentPage,
      totalPages,
      onPageChange,
      previousLabel = "Página anterior",
      nextLabel = "Próxima página",
      pageLabel = (current, total) => (
        <>
          Página <strong>{current}</strong> de <strong>{total}</strong>
        </>
      ),
      "aria-label": ariaLabel = "Paginação",
      className,
      ...props
    },
    ref,
  ) => {
    if (totalPages <= 1) return null;

    const visiblePage = Math.min(Math.max(currentPage, 1), totalPages);

    return (
      <nav
        {...props}
        ref={ref}
        aria-label={ariaLabel}
        className={cn(styles.root, className)}
      >
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={previousLabel}
          disabled={visiblePage <= 1}
          onClick={() => onPageChange(visiblePage - 1)}
          className={styles.navigationButton}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>

        <span className={styles.info} aria-live="polite" aria-atomic="true">
          {pageLabel(visiblePage, totalPages)}
        </span>

        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={nextLabel}
          disabled={visiblePage >= totalPages}
          onClick={() => onPageChange(visiblePage + 1)}
          className={styles.navigationButton}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </nav>
    );
  },
);
Pagination.displayName = "Pagination";
