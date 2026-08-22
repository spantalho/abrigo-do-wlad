import * as React from "react";
import { getDogsByIds, getShuffledDogIds } from "@/services/dogService";
import type { Dog, DogFilters } from "@/types/dogs";

const ITEMS_PER_PAGE: number = 6;

export function useDogSearch() {
  const [dogs, setDogs] = React.useState<Dog[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<boolean>(false);
  const [shuffledIds, setShuffledIds] = React.useState<string[]>([]);
  const [totalItems, setTotalItems] = React.useState<number>(0);

  const [filters, setFilters] = React.useState<DogFilters>({
    cateIdade: "all",
    tags: "all",
    cor: "all",
  });

  const [currentPage, setCurrentPage] = React.useState<number>(1);

  // buscar e embaralhar IDs quando os filtros mudarem
  React.useEffect(() => {
    async function loadShuffledIds() {
      setLoading(true);
      setError(false);
      try {
        const allShuffledIds = await getShuffledDogIds(filters);
        setShuffledIds(allShuffledIds);
        setTotalItems(allShuffledIds.length);
        setCurrentPage(1);

        if (allShuffledIds.length === 0) {
          setLoading(false);
        }
      } catch (error) {
        console.error("Erro ao carregar e embaralhar IDs:", error);
        setShuffledIds([]);
        setTotalItems(0);
        setError(true);
        setLoading(false);
      }
    }
    loadShuffledIds();
  }, [filters]);

  // Buscar os dados da página atual
  React.useEffect(() => {
    if (shuffledIds.length === 0 && totalItems > 0) {
      return;
    }
    if (totalItems === 0) {
      setDogs([]);
      return;
    }

    async function fetchPageData() {
      if (shuffledIds.length === 0) {
        setDogs([]);
        setLoading(false);
        return;
      }

      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      const idsForPage = shuffledIds.slice(start, end);

      try {
        if (idsForPage.length > 0) {
          const newDogs = await getDogsByIds(idsForPage);
          newDogs.sort(
            (a, b) => idsForPage.indexOf(a.id) - idsForPage.indexOf(b.id),
          );
          setDogs(newDogs);
        } else {
          setDogs([]);
        }
      } catch (err) {
        console.error("Erro ao carregar dados da página:", err);
        setError(true);
        setDogs([]);
      }
      setLoading(false);
    }

    if (shuffledIds.length > 0 || totalItems === 0) {
      fetchPageData();
    }
  }, [currentPage, shuffledIds, totalItems]);

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  return {
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
  };
}
