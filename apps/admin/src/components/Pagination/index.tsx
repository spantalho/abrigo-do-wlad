import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./Pagination.module.css";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null; 

  return (
    <div className={styles.container}>
      <button 
        disabled={currentPage === 1} 
        onClick={() => onPageChange(currentPage - 1)}
        className={styles.navBtn}
      >
        <ChevronLeft size={20} />
      </button>

      <span className={styles.info}>
        Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
      </span>

      <button 
        disabled={currentPage === totalPages} 
        onClick={() => onPageChange(currentPage + 1)}
        className={styles.navBtn}
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}