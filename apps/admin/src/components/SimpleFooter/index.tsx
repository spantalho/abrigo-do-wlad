import { ExternalLink } from "lucide-react";
import { PUBLIC_APP_URL } from "../../config";
import styles from "./SimpleFooter.module.css";

export function SimpleFooter() {
  return (
    <div className={styles.wrapper}>
      <a 
        href={PUBLIC_APP_URL}
        target="_blank" 
        rel="noopener noreferrer"
        className={styles.link}
      >
        Portal Principal <ExternalLink size={14} />
      </a>

      <span className={styles.divider}>|</span>

      <span className={styles.text}>Desenvolvido por</span>
      
      <a href="https://github.com/AlanClimaco" target="_blank" rel="noopener noreferrer" className={styles.devLink}>
        Alan
      </a>
      
      <span className={styles.text}>&</span>
      
      <a href="https://github.com/spantalho" target="_blank" rel="noopener noreferrer" className={styles.devLink}>
        Luis
      </a>
    </div>
  );
}
