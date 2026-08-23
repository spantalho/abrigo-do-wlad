import * as React from "react";
import * as Lucide from "lucide-react";

import { DogModal } from "./components/DogModal";
import { DogCard } from "./components/DogCard";

import { CORES_MAP, TAGS_MAP, type Dog, type DogFilters } from "@/types/dogs";
import { useDogSearch } from "@/hooks/useDogSearch";
import { useDailyDog } from "@/hooks/useDailyDog";
import { getOptimizedImageUrl } from "@/utils/cdn";
import { preloadDogImages } from "@/utils/common";
import { analytics } from "@/utils/analytics";

import HeroSmall from "@/components/HeroSmall";
import { Badge } from "@jaci/ui/Badge";
import { Skeleton } from "@jaci/ui/Skeleton";
import { Button } from "@jaci/ui/Button";

import * as TooltipComponent from "@jaci/ui/Tooltip";
import * as SelectComponent from "@jaci/ui/Select";

import styles from "./Dogs.module.css";

interface DogFiltersProps {
  filters: DogFilters;
  onFilterChange: (filters: DogFilters) => void;
  totalItems: number;
}

function DogCardSkeleton() {
  return <Skeleton style={{ height: "500px", width: "100%" }} />;
}

function DogFiltersSkeleton() {
  return (
    <div className={styles.filterContainer}>
      <div className={styles.filterItemContainer}>
        <Skeleton
          style={{ height: "40px", width: "200px", borderRadius: "8px" }}
        />
        <Skeleton
          style={{ height: "40px", width: "200px", borderRadius: "8px" }}
        />
        <Skeleton
          style={{ height: "40px", width: "200px", borderRadius: "8px" }}
        />
      </div>
      <div className={styles.filterItemContainer}>
        <Skeleton
          style={{ height: "28px", width: "120px", borderRadius: "16px" }}
        />
        <Skeleton
          style={{ height: "28px", width: "100px", borderRadius: "16px" }}
        />
      </div>
    </div>
  );
}

function DogFiltersComponent({
  filters,
  onFilterChange,
  totalItems,
}: DogFiltersProps) {
  const handleFilterChange = (filterName: keyof DogFilters, value: string) => {
    onFilterChange({ ...filters, [filterName]: value });
  };

  return (
    <div className={styles.filterContainer}>
      <div className={styles.filterItemContainer}>
        <SelectComponent.Select
          value={filters.tags}
          onValueChange={(value) => handleFilterChange("tags", value)}
        >
          <SelectComponent.SelectTrigger className={styles.selectTrigger}>
            <SelectComponent.SelectValue placeholder="Qualquer Temperamento" />
          </SelectComponent.SelectTrigger>
          <SelectComponent.SelectContent>
            <SelectComponent.SelectItem value="all">
              Qualquer Temperamento
            </SelectComponent.SelectItem>
            {Object.entries(TAGS_MAP).map(([key, label]) => (
              <SelectComponent.SelectItem key={key} value={label}>
                {label}
              </SelectComponent.SelectItem>
            ))}
          </SelectComponent.SelectContent>
        </SelectComponent.Select>

        <SelectComponent.Select
          value={filters.cateIdade}
          onValueChange={(value) => handleFilterChange("cateIdade", value)}
        >
          <SelectComponent.SelectTrigger className={styles.selectTrigger}>
            <SelectComponent.SelectValue placeholder="Todas as Idades" />
          </SelectComponent.SelectTrigger>
          <SelectComponent.SelectContent>
            <SelectComponent.SelectItem value="all">
              Todas as Idades
            </SelectComponent.SelectItem>
            <SelectComponent.SelectItem value="filhote">
              Filhote (até 1 ano)
            </SelectComponent.SelectItem>
            <SelectComponent.SelectItem value="adulto">
              Adulto (2 a 7 anos)
            </SelectComponent.SelectItem>
            <SelectComponent.SelectItem value="idoso">
              Idoso (+8 anos)
            </SelectComponent.SelectItem>
          </SelectComponent.SelectContent>
        </SelectComponent.Select>

        <SelectComponent.Select
          value={filters.cor}
          onValueChange={(value) => handleFilterChange("cor", value)}
        >
          <SelectComponent.SelectTrigger className={styles.selectTrigger}>
            <SelectComponent.SelectValue placeholder="Todas as Cores" />
          </SelectComponent.SelectTrigger>
          <SelectComponent.SelectContent>
            <SelectComponent.SelectItem value="all">
              Todas as Cores
            </SelectComponent.SelectItem>
            {Object.entries(CORES_MAP).map(([key, label]) => (
              <SelectComponent.SelectItem key={key} value={key}>
                {label}
              </SelectComponent.SelectItem>
            ))}
          </SelectComponent.SelectContent>
        </SelectComponent.Select>
      </div>
      <div className={styles.filterItemContainer}>
        <Badge
          leftIcon={<Lucide.PawPrint size={16} />}
          variant="secondary"
          size="sm"
        >
          {totalItems} doguinhos
        </Badge>
        <TooltipComponent.TooltipProvider>
          <TooltipComponent.Tooltip>
            <TooltipComponent.TooltipTrigger asChild>
              <Badge
                leftIcon={<Lucide.CircleQuestionMark size={16} />}
                variant="outline"
                size="sm"
                style={{ cursor: "help" }}
              >
                Ordem Rotativa
              </Badge>
            </TooltipComponent.TooltipTrigger>
            <TooltipComponent.TooltipContent>
              <p>
                <strong>A ordem desta lista é rotativa.</strong>
              </p>
              <p>
                Essa medida ajuda a distribuir a visibilidade de forma mais
                justa entre todos os cães.
              </p>
            </TooltipComponent.TooltipContent>
          </TooltipComponent.Tooltip>
        </TooltipComponent.TooltipProvider>
      </div>
    </div>
  );
}

export default function Dogs() {
  const {
    dogs,
    loading,
    error,
    totalItems,
    currentPage,
    totalPages,
    filters,
    setFilters,
    setCurrentPage,
    ITEMS_PER_PAGE,
  } = useDogSearch();

  const dailyDog = useDailyDog();

  const [selectedDog, setSelectedDog] = React.useState<Dog | null>(null);
  const [loadingDogId, setLoadingDogId] = React.useState<string | null>(null);
  const trackedFiltersRef = React.useRef<string>("");

  const heroImage = dailyDog?.fotos?.[0]
    ? getOptimizedImageUrl(dailyDog.fotos[0], {
        width: 1920,
        height: 800,
        quality: 80,
        crop: "fill",
        gravity: "auto",
      })
    : undefined;

  // Pré-carregamento de imagens da página atual
  React.useEffect(() => {
    const imagesToPreload = dogs
      .map((dog) =>
        getOptimizedImageUrl(dog.fotos?.[0], {
          width: 400,
          height: 600,
          quality: 75,
          crop: "fill",
          gravity: "auto",
        }),
      )
      .filter((url): url is string => !!url);

    if (imagesToPreload.length > 0) {
      preloadDogImages(imagesToPreload);
    }
  }, [dogs]);

  React.useEffect(() => {
    if (!loading) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage, loading]);

  React.useEffect(() => {
    if (!loading && dogs.length === 0) {
      const filterKey = `${filters.tags}|${filters.cateIdade}|${filters.cor}`;

      if (trackedFiltersRef.current !== filterKey) {
        analytics.trackNoResults("dogs_page", {
          filters_tags: filters.tags || "all",
          filters_age: filters.cateIdade || "all",
          filters_color: filters.cor || "all",
        });
        trackedFiltersRef.current = filterKey;
      }
    }
  }, [loading, dogs.length, filters]);

  const handleDogClick = async (dog: Dog) => {
    setLoadingDogId(dog.id);
    try {
      if (dog.fotos && dog.fotos.length > 0) {
        await preloadDogImages(dog.fotos);
      }
      setSelectedDog(dog);
    } catch (error) {
      console.error("Erro no preload:", error);
      setSelectedDog(dog);
    } finally {
      setLoadingDogId(null);
    }
  };

  return (
    <main>
      <HeroSmall
        image={heroImage as string}
        title="Nossos Doguinhos"
        badge="Amigos Fiéis"
        description="Cada um tem uma história e uma personalidade única. Utilize os filtros abaixo para encontrar quem combina com seu estilo de vida."
      />

      <div className="container">
        {loading ? (
          <DogFiltersSkeleton />
        ) : (
          <DogFiltersComponent
            filters={filters}
            onFilterChange={setFilters}
            totalItems={totalItems}
          />
        )}

        {loading ? (
          <div className={styles.dogGrid}>
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
              <DogCardSkeleton key={index} />
            ))}
          </div>
        ) : error ? (
          <div className={styles.emptyState}>
            <Lucide.ServerCrash size={48} />
            <p>
              Muitos acessos no momento! Nossos doguinhos estão famosos.<br />
              Estamos passando por uma instabilidade temporária. Tente acessar novamente em alguns instantes.
            </p>
          </div>
        ) : (
          <>
            <div className={styles.dogGrid}>
              {dogs.length > 0 ? (
                dogs.map((dog) => (
                  <DogCard
                    key={dog.id}
                    data={dog}
                    onClick={() => handleDogClick(dog)}
                    isLoading={loadingDogId === dog.id}
                  />
                ))
              ) : (
                <div className={styles.emptyState}>
                  <Lucide.Frown size={48} />
                  <p>
                    Nenhum doguinho encontrado com essas características no
                    momento.
                  </p>
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <Lucide.ChevronLeft size={20} />
                </Button>
                <span className={styles.pageInfo}>
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <Lucide.ChevronRight size={20} />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <DogModal
        dog={
          selectedDog
            ? {
                ...selectedDog,
                cor: CORES_MAP[selectedDog.cor] || selectedDog.cor,
              }
            : null
        }
        isOpen={!!selectedDog}
        onClose={() => setSelectedDog(null)}
      />
    </main>
  );
}
