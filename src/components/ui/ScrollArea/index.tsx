import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import styles from "./ScrollArea.module.css";

interface ScrollAreaProps
  extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  showScrollShadows?: boolean;
}

export const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  ScrollAreaProps
>(({ className, children, showScrollShadows = false, ...props }, ref) => {
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const [shadowState, setShadowState] = React.useState({
    top: false,
    bottom: false,
  });

  const updateScrollShadows = React.useCallback(() => {
    if (!showScrollShadows || !viewportRef.current) return;

    const viewport = viewportRef.current;
    const top = viewport.scrollTop > 1;
    const bottom =
      viewport.scrollTop + viewport.clientHeight < viewport.scrollHeight - 1;

    setShadowState((current) =>
      current.top === top && current.bottom === bottom
        ? current
        : { top, bottom },
    );
  }, [showScrollShadows]);

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
      className={`${styles.ScrollAreaRoot} ${className || ""}`}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        className={styles.ScrollAreaViewport}
        onScroll={updateScrollShadows}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner className={styles.ScrollAreaCorner} />
      {showScrollShadows && (
        <>
          <div
            aria-hidden="true"
            className={`${styles.ScrollShadow} ${styles.ScrollShadowTop} ${
              shadowState.top ? styles.ScrollShadowVisible : ""
            }`}
          />
          <div
            aria-hidden="true"
            className={`${styles.ScrollShadow} ${styles.ScrollShadowBottom} ${
              shadowState.bottom ? styles.ScrollShadowVisible : ""
            }`}
          />
        </>
      )}
    </ScrollAreaPrimitive.Root>
  );
});
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

export const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Scrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Scrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.Scrollbar
    ref={ref}
    orientation={orientation}
    className={`${styles.ScrollAreaScrollbar} ${className || ""}`}
    {...props}
  >
    <ScrollAreaPrimitive.Thumb className={styles.ScrollAreaThumb} />
  </ScrollAreaPrimitive.Scrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.Scrollbar.displayName;
