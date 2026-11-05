import { useCallback, useEffect, useState } from "react";
import {
  listPublicCategories,
  listPublicProducts,
} from "../services/publicCatalogService";
import type {
  PublicCatalogFilters,
  PublicCategory,
  PublicProduct,
} from "../types/publicCatalog";
import { SIGNED_IMAGE_REFRESH_MS } from "../services/signProductImage";

export function usePublicCatalog(filters: PublicCatalogFilters) {
  const { search, categoryId } = filters;
  const [products, setProducts] = useState<PublicProduct[]>([]);

  const [categories, setCategories] = useState<PublicCategory[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const data = await listPublicProducts({ search, categoryId });

      setProducts(data);
    } catch (error) {
      console.error("Erro ao carregar catálogo:", error);

      setLoadError(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o catálogo.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [search, categoryId]);

  useEffect(() => {
    void loadProducts();
    const timer = window.setInterval(() => { void loadProducts(); }, SIGNED_IMAGE_REFRESH_MS);
    const onVisible = () => { if (!document.hidden) void loadProducts(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadProducts]);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const data = await listPublicCategories();

        if (!cancelled) {
          setCategories(data);
        }
      } catch (error) {
        console.error("Erro ao carregar categorias:", error);
      }
    }

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    products,
    categories,
    isLoading,
    loadError,
    reload: loadProducts,
  };
}
