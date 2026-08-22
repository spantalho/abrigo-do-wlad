import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import * as Lucide from "lucide-react";

import { Button } from "@abrigo/ui/Button";
import { Badge } from "@abrigo/ui/Badge";

import styles from "./HistorySection.module.css";
import sectionImage from "@/assets/images/wlad.jpg";

export function HistorySection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.2,
      },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="historia"
      className={`${styles.contentSection}`}
      ref={sectionRef}
    >
      <div className={styles.gridContainer}>
        <div
          className={`${styles.imageWrapper} ${
            isVisible ? styles.visible : ""
          }`}
        >
          <img src={sectionImage} alt="Wlad" />
          <Badge
            variant="secondary"
            size="md"
            leftIcon={<Lucide.CircleUserRound />}
            style={{
              position: "absolute",
              bottom: "-0.5rem",
              left: "-0.5rem",
              zIndex: 10,
              pointerEvents: "none",
              border: "3px solid var(--bg-body)",
            }}
          >
            Wlad
          </Badge>
        </div>

        <div
          className={`${styles.textSide} ${isVisible ? styles.visible : ""}`}
        >
          <h2 className="section-title">Nossa História</h2>

          <p>
            Há mais de 12 anos, <strong>Wladimir Cruz</strong> decidiu deixar um
            emprego estável e bem remunerado para seguir a paixão herdada de seu
            pai, Sr. Bene, que sempre ajudou pessoas e animais. Sr. Bene
            costumava acolher cães abandonados e até abriu espaço em sua casa
            para oferecer lar temporário aos resgatados.
          </p>

          <p>
            Inspirado pelo exemplo do pai e pelo amor à causa animal, Wladimir
            começou a resgatar cães e transformar o amplo quintal da família em
            um abrigo para animais abandonados. Assim nasceu o Abrigo do Wlad,
            um espaço dedicado a oferecer cuidado e esperança para cães que
            precisam de um novo lar.
          </p>

          <div className={styles.buttonWrapper}>
            <Link to="/sobre">
              <Button variant="text">
                Ler história completa <Lucide.ArrowRight size={20} />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
