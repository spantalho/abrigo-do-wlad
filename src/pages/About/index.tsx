import { Link } from "react-router";
import { useRef } from "react";
import * as Lucide from "lucide-react";
import * as CardComponent from "../../components/ui/Card";
import HeroSmall from "../../components/HeroSmall";
import { Skeleton } from "../../components/ui/Skeleton";
import { ScrollIndicators } from "../../components/ScrollIndicators";

import { getOptimizedImageUrl } from "../../utils/cdn";
import { useDailyDog } from "../../hooks/useDailyDog";

import styles from "./About.module.css";
import * as TooltipComponent from "../../components/ui/Tooltip";
import { Badge } from "../../components/ui/Badge";

import { useMediaQuery } from "@uidotdev/usehooks";
import { PageFeedback } from "@/components/PageFeedback";

import heroImage from "@/assets/images/wlad.jpg"

export default function About() {
  const dog = useDailyDog();

  const image = dog?.fotos?.[0] ?? null;

  const sectionImageUrl = image
    ? getOptimizedImageUrl(image, {
        crop: "fill",
        width: 400,
        height: 600,
        quality: 100,
      })
    : "";

  const isDesktop = useMediaQuery("(min-width: 768px)");
  const containerRef = useRef<HTMLDivElement>(null!);

  return (
    <>
      <ScrollIndicators
        containerRef={containerRef}
        sectionCount={1}
        labels={["Trajetória"]}
      />
      <HeroSmall
        image={heroImage}
        badge="Nossa Trajetória"
        title="Uma história de amor e renúncia"
        description="Conheça os passos que transformaram um quintal em um refúgio de esperança."
      />
      <div className="container" ref={containerRef}>
        <div
          className={styles.historyContainer}
          style={{ gridTemplateColumns: "1.5fr 1fr", alignItems: "start" }}
        >
          <div className={styles.historyText}>
            <h2 className="section-title" data-subsection="Como tudo começou">
              Como tudo começou
            </h2>
            <p>
              Há mais de 12 anos, Wladimir Cruz deixou emprego fixo e bem
              remunerado para seguir os passos de seu pai que era uma pessoa que
              ajudava a todos e principalmente os animais. Não podia ver um
              cãozinho perdido que já trazia para casa.
            </p>
            <p>
              Com o tempo o Sr. Bene, pai do Wladimir, começou a ajudar outros
              protetores de animais abrindo um espaço da sua casa para dar lar
              temporário para os cães resgatados. Recebia uns trocados como
              agradecimento. Seu filho, também amante da causa animal, começou a
              resgatar e logo o amplo quintal passou a ser o lar temporário para
              muitos cães abandonados e ai surgiu o Abrigo do Wlad.
            </p>

            <h3 data-subsection="O Espaço">O Espaço</h3>
            <p>
              Apesar do Wladimir iniciar a prestação de serviços de lar
              temporário de forma mais consistente, os recursos sempre foram
              escassos porque os gastos com um animalzinho não se atém a ração e
              água. Empregados, luz, água, medicação, manutenção, veterinário,
              internações e outras despesas consomem o valor mensal que se
              recebe pelo serviço prestado. Além de que os cães resgatados pelo
              próprio Wladimir são custeados integralmente por ele.
            </p>

            <p>
              No entanto, são 12 anos que se passaram sem uma reforma no abrigo
              e hoje o espaço está bem deteriorado e já não atende a necessidade
              de conforto para os animais, muitos viverão para sempre lá dentro.
            </p>

            <p>
              Com a ajuda de amigos e alguns projetos implantados, em 2020
              iniciou-se uma obra no terreno ao lado do abrigo para construir os
              espaços de idosos especiais, quarentena e medicação. Em 2021
              iniciamos as obras da parte antiga que está bem deteriorada. Pisos
              com buracos, infiltrações nas paredes e pisos, adequação dos
              espaços para melhorar a distribuição dos cães, novos portões de
              segurança, telas e telhado novo.
            </p>

            <div data-subsection="Captação de Recursos">
              <CardComponent.Card tone="info" variant="callout">
                <CardComponent.CardBody>
                  <CardComponent.CardHeader>
                    <CardComponent.CardIcon>
                      <Lucide.HandCoins size={30} strokeWidth={1.5} />
                    </CardComponent.CardIcon>
                    <CardComponent.CardTitle>
                      Captação de Recursos
                    </CardComponent.CardTitle>
                  </CardComponent.CardHeader>
                  <CardComponent.CardContent>
                    <p style={{ textAlign: "justify" }}>
                      Um dos projetos implantado para arrecadação de recursos
                      para financiar a obra foi a reciclagem de tampinhas
                      plásticas. Consiste na coleta de tampas plásticas ou
                      qualquer material que seja de polipropileno que é vendido
                      para empresas que transformam esse material e revendem
                      para a indústria de brinquedos, eletrodomésticos,
                      automobilística e outras.
                    </p>
                  </CardComponent.CardContent>
                </CardComponent.CardBody>
                <CardComponent.CardFooter>
                  <Link to="/tampinhas" className="btn-text">
                    <CardComponent.CardButton>
                      Saiba Mais <Lucide.ArrowRight size={20} />
                    </CardComponent.CardButton>
                  </Link>
                </CardComponent.CardFooter>
              </CardComponent.Card>
            </div>

            <PageFeedback pageId="sobre_nos" />
          </div>

          <div className={styles.historyImageContainer}>
            {sectionImageUrl && isDesktop ? (
              <TooltipComponent.TooltipProvider>
                <TooltipComponent.Tooltip alwaysOpen={true}>
                  <TooltipComponent.TooltipTrigger>
                    <div style={{ position: "relative" }}>
                      <img
                        className={styles.historyImage}
                        src={sectionImageUrl}
                        alt={dog ? `Foto de ${dog.nome}` : "Cachorro do abrigo"}
                      />
                      {dog && dog.nome && (
                        <Badge
                          variant="primary"
                          size="sm"
                          leftIcon={<Lucide.Dog />}
                          style={{
                            position: "absolute",
                            bottom: "-0.5rem",
                            right: "-0.5rem",
                            zIndex: 10,
                            pointerEvents: "none",
                            border: "3px solid var(--bg-body)",
                          }}
                        >
                          {dog.nome}
                        </Badge>
                      )}
                    </div>
                  </TooltipComponent.TooltipTrigger>
                  <TooltipComponent.TooltipContent side="bottom">
                    <p>
                      <strong>12+ Anos de História</strong>
                    </p>
                    <p>
                      Centenas de vidas transformadas pelo amor e dedicação de
                      voluntários.
                    </p>
                  </TooltipComponent.TooltipContent>
                </TooltipComponent.Tooltip>
              </TooltipComponent.TooltipProvider>
            ) : (
              <Skeleton className={styles.historyImage} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
