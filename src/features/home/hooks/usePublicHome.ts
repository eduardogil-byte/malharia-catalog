import { useCallback, useEffect, useState } from "react";
import { listPublicHomeSections } from "../services/publicHomeService";
import type { PublicHomeSection } from "../types/publicHome";
import { SIGNED_IMAGE_REFRESH_MS } from "../../catalog/services/signProductImage";
import { listPublicCategories } from "../../catalog/services/publicCatalogService";
import type { PublicCategory } from "../../catalog/types/publicCatalog";

export function usePublicHome() {
  const [sections, setSections] = useState<PublicHomeSection[]>([]);
  const [categories, setCategories] = useState<PublicCategory[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState<string | null>(null);

  const loadSections = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const data = await listPublicHomeSections();

      setSections(data);
    } catch (error) {
      console.error("Erro ao carregar página inicial:", error);

      setLoadError(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar a página inicial.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSections();
    void listPublicCategories().then(setCategories).catch((error: unknown) => {
      console.error("Erro ao carregar categorias da home:", error);
    });
    const timer = window.setInterval(() => { void loadSections(); }, SIGNED_IMAGE_REFRESH_MS);
    const onVisible = () => { if (!document.hidden) void loadSections(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadSections]);

  return {
    sections,
    categories,
    isLoading,
    loadError,
    reload: loadSections,
  };
}
