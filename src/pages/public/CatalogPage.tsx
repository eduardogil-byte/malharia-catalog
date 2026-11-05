import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { PublicProductCard } from "../../features/catalog/components/PublicProductCard";
import { usePublicCatalog } from "../../features/catalog/hooks/usePublicCatalog";
import type { PublicCatalogFilters } from "../../features/catalog/types/publicCatalog";

function filtersFromParams(params: URLSearchParams): PublicCatalogFilters {
  return {
    search: params.get("busca") ?? "",
    categoryId: params.get("categoria") ?? "",
  };
}

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [draftFilters, setDraftFilters] = useState<PublicCatalogFilters>(() => filtersFromParams(searchParams));
  const appliedFilters = filtersFromParams(searchParams);
  const { products, categories, isLoading, isLoadingMore, hasMore, loadError, loadMoreError, reload, loadMore } =
    usePublicCatalog(appliedFilters);
  const hasActiveFilters = Boolean(appliedFilters.search || appliedFilters.categoryId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = new URLSearchParams();
    if (draftFilters.search.trim()) next.set("busca", draftFilters.search.trim());
    if (draftFilters.categoryId) next.set("categoria", draftFilters.categoryId);
    setSearchParams(next);
  }

  function clearFilters() {
    setDraftFilters({ search: "", categoryId: "" });
    setSearchParams(new URLSearchParams());
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
      <header className="max-w-3xl">
        <h1 className="text-4xl leading-tight text-stone-950 sm:text-6xl">Catálogo</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600 sm:text-lg">
          Explore as malhas e os produtos artesanais. Abra um produto para ver mais fotos e consultar pelo WhatsApp.
        </p>
      </header>

      <form onSubmit={handleSubmit} role="search" className="mt-8 rounded-md border border-stone-200 bg-white p-4 sm:p-5">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(12rem,0.55fr)_auto] md:items-end">
          <div>
            <label htmlFor="catalog-search" className="mb-2 block text-sm font-medium text-stone-700">Pesquisar produtos</label>
            <input
              id="catalog-search"
              type="search"
              value={draftFilters.search}
              onChange={(event) => setDraftFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Ex.: malha floral, vela..."
              className="form-control"
            />
          </div>
          <div>
            <label htmlFor="catalog-category" className="mb-2 block text-sm font-medium text-stone-700">Categoria</label>
            <select
              id="catalog-category"
              value={draftFilters.categoryId}
              onChange={(event) => setDraftFilters((current) => ({ ...current, categoryId: event.target.value }))}
              className="form-control"
            >
              <option value="">Todas as categorias</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.nome}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="button-primary flex-1 md:flex-none">Buscar</button>
            {hasActiveFilters && (
              <button type="button" onClick={clearFilters} className="button-secondary flex-1 md:flex-none">Limpar</button>
            )}
          </div>
        </div>
      </form>

      <div className="mt-9 sm:mt-12">
        {isLoading && (
          <div className="rounded-md border border-stone-200 bg-white p-10 text-center text-stone-600" aria-live="polite">
            Carregando produtos...
          </div>
        )}
        {!isLoading && loadError && (
          <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-sm text-red-800">{loadError}</p>
            <button type="button" onClick={() => void reload()} className="button-secondary mt-4">Tentar novamente</button>
          </div>
        )}
        {!isLoading && !loadError && products.length === 0 && (
          <div className="rounded-md border border-stone-200 bg-white px-6 py-12 text-center">
            <h2 className="text-2xl text-stone-950">Nenhum produto encontrado</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-stone-600">
              {hasActiveFilters
                ? "Tente outro nome ou escolha uma categoria diferente."
                : "Ainda não há produtos publicados. Volte em breve para conhecer as novidades."}
            </p>
            {hasActiveFilters && <button type="button" onClick={clearFilters} className="button-secondary mt-6">Ver todos os produtos</button>}
          </div>
        )}
        {!isLoading && !loadError && products.length > 0 && (
          <>
            <p className="mb-5 text-sm text-stone-600" aria-live="polite">
              {products.length === 1 ? "1 produto exibido" : `${products.length} produtos exibidos`}
              {hasMore ? " · há mais para ver" : ""}
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-7">
              {products.map((product) => <PublicProductCard key={product.id} product={product} />)}
            </div>
            {loadMoreError && <p role="alert" className="mt-8 text-center text-sm text-red-700">{loadMoreError}</p>}
            {hasMore && (
              <div className="mt-10 flex justify-center">
                <button type="button" onClick={() => void loadMore()} disabled={isLoadingMore} className="button-secondary w-full sm:w-auto">
                  {isLoadingMore ? "Carregando..." : "Carregar mais produtos"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
