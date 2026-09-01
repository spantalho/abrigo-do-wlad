import * as React from "react";
import {
  DogFeedVersionError,
  getDogFeedPage,
} from "@/services/dogService";
import type { Dog, DogFilters } from "@/types/dogs";

const ITEMS_PER_PAGE = 6;

export function useDogSearch() {
  const [dogs, setDogs] = React.useState<Dog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [totalItems, setTotalItems] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(0);
  const [filters, setFiltersState] = React.useState<DogFilters>({
    cateIdade: "all",
    tags: [],
    cor: "all",
  });
  const [currentPage, setCurrentPage] = React.useState(1);
  const feedVersionRef = React.useRef<string | undefined>(undefined);

  const setFilters = React.useCallback((nextFilters: DogFilters) => {
    setFiltersState(nextFilters);
    setCurrentPage(1);
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();

    async function fetchPage() {
      setLoading(true);
      setError(false);
      try {
        let page: Awaited<ReturnType<typeof getDogFeedPage>>;
        try {
          page = await getDogFeedPage(
            filters,
            currentPage,
            ITEMS_PER_PAGE,
            feedVersionRef.current,
            controller.signal,
          );
        } catch (requestError) {
          if (!(requestError instanceof DogFeedVersionError)) throw requestError;
          feedVersionRef.current = undefined;
          if (currentPage !== 1) {
            setCurrentPage(1);
            return;
          }
          page = await getDogFeedPage(
            filters,
            1,
            ITEMS_PER_PAGE,
            undefined,
            controller.signal,
          );
        }
        if (controller.signal.aborted) return;
        feedVersionRef.current = page.version;
        setDogs(page.dogs);
        setTotalItems(page.totalItems);
        setTotalPages(page.totalPages);
      } catch (requestError) {
        if (controller.signal.aborted) return;
        console.error("Erro ao carregar a página de cães:", requestError);
        setDogs([]);
        setTotalItems(0);
        setTotalPages(0);
        setError(true);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setHasLoaded(true);
        }
      }
    }

    void fetchPage();
    return () => controller.abort();
  }, [currentPage, filters]);

  return {
    dogs,
    loading,
    hasLoaded,
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
