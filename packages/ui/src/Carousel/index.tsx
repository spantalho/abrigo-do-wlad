import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import styles from "./Carousel.module.css";

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
  }),
  center: {
    zIndex: 1,
    x: 0,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? "100%" : "-100%",
  }),
};

const SWIPE_CONFIDENCE_THRESHOLD: number = 10000;

const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

interface CarouselProps {
  children: React.ReactNode;
  render: (api: CarouselAPI) => React.ReactNode;
  loop?: boolean;
  draggable?: boolean;
}
/**
 * API do carrossel para lidar com paginação e direção
 */
export interface CarouselAPI {
  page: number;
  direction: number;
  totalPages: number;
  goTo: (page: number) => void;
  goNext: () => void;
  goPrev: () => void;
}

export function Carousel({
  children,
  render,
  loop = false,
  draggable = true,
}: CarouselProps) {
  const [[page, direction], setPage] = React.useState([0, 0]);
  const [isDragging, setIsDragging] = React.useState<boolean>(false);
  const items = React.Children.toArray(children);
  const totalPages = items.length;

  const containerRef = React.useRef<HTMLDivElement>(null);

  const paginate = (newDirection: number) => {
    if (
      !loop &&
      (page + newDirection < 0 || page + newDirection >= totalPages)
    ) {
      return;
    }
    setPage([page + newDirection, newDirection]);
  };

  const goTo = (newPage: number) => {
    const newDirection = newPage > page ? 1 : -1;
    setPage([newPage, newDirection]);
  };

  const goNext = () => paginate(1);
  const goPrev = () => paginate(-1);

  const pageIndex = loop
    ? ((page % totalPages) + totalPages) % totalPages
    : Math.max(0, Math.min(page, totalPages - 1));

  const api: CarouselAPI = {
    page: pageIndex,
    direction,
    totalPages,
    goTo,
    goNext,
    goPrev,
  };

  return (
    <div ref={containerRef} className={styles.root}>
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={page}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
          }}
          drag={draggable ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={(_, { offset, velocity }) => {
            setIsDragging(false);
            if (!draggable) return;
            const swipe = swipePower(offset.x, velocity.x);

            if (swipe < -SWIPE_CONFIDENCE_THRESHOLD) {
              goNext();
            } else if (swipe > SWIPE_CONFIDENCE_THRESHOLD) {
              goPrev();
            }
          }}
          className={styles.mainImage}
          style={{
            cursor: draggable ? (isDragging ? "grabbing" : "grab") : "default",
          }}
        >
          {items[pageIndex]}
        </motion.div>
      </AnimatePresence>
      {render(api)}
    </div>
  );
}
