import { Hero } from "@/pages/Home/components/Hero";
import { useDailyDog } from "@/hooks/useDailyDog";
import { ScrollIndicators } from "@/components/ScrollIndicators";

import { ActionCards } from "./components/ActionCards";
import { HistorySection } from "./components/HistorySection";
import { FaqSection } from "./components/FaqSection";

import styles from "./Home.module.css";
import { useRef } from "react";
import { StoreSection } from "./components/StoreSection";

export default function Home() {
  const dog = useDailyDog();
  const containerRef = useRef<HTMLDivElement>(null!);

  const sectionLabels = ["Destaque", "Ações", "História", "Loja", "Dúvidas"];

  return (
    <main>
      <ScrollIndicators
        containerRef={containerRef}
        sectionCount={5}
        labels={sectionLabels}
      />
      <div className={`container ${styles.homeContainer}`} ref={containerRef}>
        <Hero dog={dog} />
        <ActionCards />
        <HistorySection />
        <StoreSection />
        <FaqSection />
      </div>
    </main>
  );
}
