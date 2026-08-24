import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import styles from "./ScrollArea.module.css";

interface ScrollAreaProps
  extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  orientation?: "vertical" | "horizontal";
  showScrollbar?: boolean;
  showScrollShadows?: boolean;
}

export const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  ScrollAreaProps
>(
  (
    {
      className,
      children,
      orientation = "vertical",
      showScrollbar = true,
      showScrollShadows = false,
      ...props
    },
    ref,
  ) => {
    const viewportRef = React.useRef<HTMLDivElement>(null);
    const [shadowState, setShadowState] = React.useState({
      start: false,
      end: false,
    });

    const updateScrollShadows = React.useCallback(() => {
      if (!showScrollShadows || !viewportRef.current) return;

      const viewport = viewportRef.current;
      const isHorizontal = orientation === "horizontal";
      const scrollPosition = isHorizontal
        ? viewport.scrollLeft
        : viewport.scrollTop;
      const viewportSize = isHorizontal
        ? viewport.clientWidth
        : viewport.clientHeight;
      const scrollSize = isHorizontal
        ? viewport.scrollWidth
        : viewport.scrollHeight;
      const start = scrollPosition > 1;
      const end = scrollPosition + viewportSize < scrollSize - 1;

      setShadowState((current) =>
        current.start === start && current.end === end
          ? current
          : { start, end },
      );
    }, [orientation, showScrollShadows]);

    React.useLayoutEffect(() => {
      if (!showScrollShadows || !viewportRef.current) return;

      const viewport = viewportRef.current;
      const frame = requestAnimationFrame(updateScrollShadows);
      const resizeObserver = new ResizeObserver(updateScrollShadows);

      resizeObserver.observe(viewport);
      if (viewport.firstElementChild) {
        resizeObserver.observe(viewport.firstElementChild);
      }

      return () => {
        cancelAnimationFrame(frame);
        resizeObserver.disconnect();
      };
    }, [children, showScrollShadows, updateScrollShadows]);

    return (
      <ScrollAreaPrimitive.Root
        ref={ref}
        className={`${styles.ScrollAreaRoot} ${
          showScrollbar ? "" : styles.ScrollAreaWithoutScrollbar
        } ${className || ""}`}
        {...props}
      >
        <ScrollAreaPrimitive.Viewport
          ref={viewportRef}
          className={styles.ScrollAreaViewport}
          onScroll={updateScrollShadows}
        >
          {children}
        </ScrollAreaPrimitive.Viewport>
        <ScrollBar orientation={orientation} showThumb={showScrollbar} />
        {showScrollbar && (
          <ScrollAreaPrimitive.Corner className={styles.ScrollAreaCorner} />
        )}
        {showScrollShadows && (
          <>
            <div
              aria-hidden="true"
              className={`${styles.ScrollShadow} ${
                orientation === "horizontal"
                  ? `${styles.ScrollShadowHorizontal} ${styles.ScrollShadowLeft}`
                  : `${styles.ScrollShadowVertical} ${styles.ScrollShadowTop}`
              } ${shadowState.start ? styles.ScrollShadowVisible : ""}`}
            />
            <div
              aria-hidden="true"
              className={`${styles.ScrollShadow} ${
                orientation === "horizontal"
                  ? `${styles.ScrollShadowHorizontal} ${styles.ScrollShadowRight}`
                  : `${styles.ScrollShadowVertical} ${styles.ScrollShadowBottom}`
              } ${shadowState.end ? styles.ScrollShadowVisible : ""}`}
            />
          </>
        )}
      </ScrollAreaPrimitive.Root>
    );
  },
);
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

export const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Scrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Scrollbar> & {
    showThumb?: boolean;
  }
>(({ className, orientation = "vertical", showThumb = true, ...props }, ref) => (
  <ScrollAreaPrimitive.Scrollbar
    ref={ref}
    orientation={orientation}
    className={`${styles.ScrollAreaScrollbar} ${
      showThumb ? "" : styles.ScrollAreaScrollbarHidden
    } ${className || ""}`}
    {...props}
  >
    {showThumb && (
      <ScrollAreaPrimitive.Thumb className={styles.ScrollAreaThumb} />
    )}
  </ScrollAreaPrimitive.Scrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.Scrollbar.displayName;
