import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import styles from "./ThemeToggle.module.css";
import { analytics } from "@/utils/analytics";
import { STORAGE_KEYS } from "@/lib/storage";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@jaci/ui/Tooltip";
import { motion } from "motion/react";

function getInitialTheme(): boolean {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.UI.THEME);
  const systemPrefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;
  return savedTheme === "dark" || (!savedTheme && systemPrefersDark);
}

export function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(getInitialTheme);

  useEffect(() => {
    if (isDark) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [isDark]);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);

    // Atualiza a classe no body e salva a preferência
    if (newTheme) {
      document.body.classList.add("dark-mode");
      localStorage.setItem(STORAGE_KEYS.UI.THEME, "dark");
      analytics.trackThemeToggle("dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem(STORAGE_KEYS.UI.THEME, "light");
      analytics.trackThemeToggle("light");
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={styles.switchContainer}>
            <button
              className={`${styles.switch} ${isDark ? styles.dark : ""}`}
              onClick={toggleTheme}
              role="switch"
              aria-checked={isDark}
              aria-label={
                isDark ? "Mudar para modo claro" : "Mudar para modo escuro"
              }
            >
              <motion.div
                className={styles.thumb}
                animate={{ x: isDark ? 20 : 0 }}
                transition={{
                  type: "spring",
                  stiffness: 700,
                  damping: 30,
                }}
              >
                {isDark ? (
                  <Moon className={styles.icon} />
                ) : (
                  <Sun className={styles.icon} />
                )}
              </motion.div>
            </button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            Alterar para{" "}
            <strong>{isDark ? "modo claro" : "modo escuro"}</strong>
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
