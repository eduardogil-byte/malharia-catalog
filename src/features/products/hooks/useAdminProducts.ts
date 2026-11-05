import { useCallback, useEffect, useState } from "react";
import { listCategoriesAdmin } from "../../categories/services/categoryService";
import type { Category } from "../../categories/types/category";
import {
  deleteArchivedProduct,
  listProductsAdmin,
  setProductStatus,
} from "../services/productService";
import type {
  ProductListFilters,
  ProductStatus,
  ProductWithCategory,
} from "../types/product";

export function useAdminProducts(filters: ProductListFilters) {
  const { search, categoryId, status } = filters;
  const [products, setProducts] = useState<ProductWithCategory[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const data = await listProductsAdmin({ search, categoryId, status });

      setProducts(data);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);

      setLoadError(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os produtos.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [search, categoryId, status]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await listCategoriesAdmin();

      setCategories(data);
    } catch (error) {
      console.error("Erro ao carregar categorias para o filtro:", error);
    }
  }, []);

  const changeProductStatus = useCallback(
    async (productId: string, status: ProductStatus) => {
      await setProductStatus(productId, status);

      await loadProducts();
    },
    [loadProducts],
  );

  const removeProduct = useCallback(
    async (productId: string) => {
      await deleteArchivedProduct(productId);

      await loadProducts();
    },
    [loadProducts],
  );

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  return {
    products,
    categories,
    isLoading,
    loadError,
    reload: loadProducts,
    changeProductStatus,
    removeProduct,
  };
}
