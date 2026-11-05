import { useCallback, useEffect, useRef, useState } from "react";
import {
  listPublicCategories,
  listPublicProducts,
  PUBLIC_CATALOG_PAGE_SIZE,
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const visibleCount = useRef(PUBLIC_CATALOG_PAGE_SIZE);
  const requestSequence = useRef(0);
  const invalidateRequests = useCallback(() => { requestSequence.current++; }, []);

  const loadProducts = useCallback(async () => {
    const requestId = ++requestSequence.current;
    setIsLoading(true);
    setIsLoadingMore(false);
    setLoadError(null);
    setLoadMoreError(null);
    try {
      const data = await listPublicProducts(
        { search, categoryId }, 0, visibleCount.current + 1,
      );
      if (requestId !== requestSequence.current) return;
      setHasMore(data.length > visibleCount.current);
      setProducts(data.slice(0, visibleCount.current));
    } catch (error) {
      if (requestId !== requestSequence.current) return;
      console.error("Erro ao carregar catálogo:", error);
      setLoadError(error instanceof Error ? error.message : "Não foi possível carregar o catálogo.");
    } finally {
      if (requestId === requestSequence.current) setIsLoading(false);
    }
  }, [search, categoryId]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || isLoading) return;
    const requestId = ++requestSequence.current;
    setIsLoadingMore(true);
    setLoadMoreError(null);
    try {
      const data = await listPublicProducts(
        { search, categoryId }, visibleCount.current, PUBLIC_CATALOG_PAGE_SIZE + 1,
      );
      if (requestId !== requestSequence.current) return;
      const nextProducts = data.slice(0, PUBLIC_CATALOG_PAGE_SIZE);
      visibleCount.current += nextProducts.length;
      setProducts((current) => [...current, ...nextProducts]);
      setHasMore(data.length > PUBLIC_CATALOG_PAGE_SIZE);
    } catch (error) {
      if (requestId !== requestSequence.current) return;
      console.error("Erro ao carregar mais produtos:", error);
      setLoadMoreError("Não foi possível carregar mais produtos. Tente novamente.");
    } finally {
      if (requestId === requestSequence.current) setIsLoadingMore(false);
    }
  }, [search, categoryId, hasMore, isLoading, isLoadingMore]);

  useEffect(() => {
    visibleCount.current = PUBLIC_CATALOG_PAGE_SIZE;
    void loadProducts();
    const timer = window.setInterval(() => { void loadProducts(); }, SIGNED_IMAGE_REFRESH_MS);
    const onVisible = () => { if (!document.hidden) void loadProducts(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      invalidateRequests();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadProducts, invalidateRequests]);

  useEffect(() => {
    let cancelled = false;
    async function loadCategories() {
      try {
        const data = await listPublicCategories();
        if (!cancelled) setCategories(data);
      } catch (error) {
        console.error("Erro ao carregar categorias:", error);
      }
    }
    void loadCategories();
    return () => { cancelled = true; };
  }, []);

  return {
    products,
    categories,
    isLoading,
    isLoadingMore,
    hasMore,
    loadError,
    loadMoreError,
    reload: loadProducts,
    loadMore,
  };
}
