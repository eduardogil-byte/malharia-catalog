import { useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router";
import { useAdminProducts } from "../../features/products/hooks/useAdminProducts";
import type {
  ProductListFilters,
  ProductStatus,
  ProductWithCategory,
} from "../../features/products/types/product";

import { ResponsiveTableRegion } from "../../shared/components/ResponsiveTableRegion";

const initialFilters: ProductListFilters = {
  search: "",
  categoryId: "",
  status: "",
};

const statusLabels: Record<ProductStatus, string> = {
  rascunho: "Rascunho",
  publicado: "Publicado",
  arquivado: "Arquivado",
};

function getStatusLabel(status: string): string {
  if (
    status === "rascunho" ||
    status === "publicado" ||
    status === "arquivado"
  ) {
    return statusLabels[status];
  }

  return status;
}

function getStatusClasses(status: string): string {
  switch (status) {
    case "publicado":
      return "bg-green-100 text-green-800";

    case "arquivado":
      return "bg-stone-200 text-stone-700";

    default:
      return "bg-amber-100 text-amber-800";
  }
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data indisponível";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function ProductsPage() {
  const location = useLocation();
  const navigationNotice = typeof location.state?.notice === "string" ? location.state.notice : null;
  const [draftFilters, setDraftFilters] =
    useState<ProductListFilters>(initialFilters);

  const [appliedFilters, setAppliedFilters] =
    useState<ProductListFilters>(initialFilters);

  const [actionError, setActionError] = useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [actingProductId, setActingProductId] = useState<string | null>(null);

  const {
    products,
    categories,
    isLoading,
    loadError,
    reload,
    changeProductStatus,
    removeProduct,
  } = useAdminProducts(appliedFilters);

  function clearMessages() {
    setActionError(null);
    setSuccessMessage(null);
  }

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    clearMessages();

    setAppliedFilters({
      search: draftFilters.search.trim(),
      categoryId: draftFilters.categoryId,
      status: draftFilters.status,
    });
  }

  function clearFilters() {
    clearMessages();
    setDraftFilters(initialFilters);
    setAppliedFilters(initialFilters);
  }

  async function handleArchive(product: ProductWithCategory) {
    const confirmed = window.confirm(
      `Deseja arquivar o produto "${product.nome}"?`,
    );

    if (!confirmed) {
      return;
    }

    clearMessages();
    setActingProductId(product.id);

    try {
      await changeProductStatus(product.id, "arquivado");

      setSuccessMessage("Produto arquivado com sucesso.");
    } catch (error) {
      console.error("Erro ao arquivar produto:", error);

      setActionError(
        error instanceof Error
          ? error.message
          : "Não foi possível arquivar o produto.",
      );
    } finally {
      setActingProductId(null);
    }
  }

  async function handleRestore(product: ProductWithCategory) {
    clearMessages();
    setActingProductId(product.id);

    try {
      await changeProductStatus(product.id, "rascunho");

      setSuccessMessage("Produto restaurado como rascunho.");
    } catch (error) {
      console.error("Erro ao restaurar produto:", error);

      setActionError(
        error instanceof Error
          ? error.message
          : "Não foi possível restaurar o produto.",
      );
    } finally {
      setActingProductId(null);
    }
  }

  async function handleDelete(product: ProductWithCategory) {
    const confirmed = window.confirm(
      `Excluir definitivamente o produto "${product.nome}"? Essa ação não poderá ser desfeita.`,
    );

    if (!confirmed) {
      return;
    }

    clearMessages();
    setActingProductId(product.id);

    try {
      await removeProduct(product.id);

      setSuccessMessage("Produto excluído definitivamente.");
    } catch (error) {
      console.error("Erro ao excluir produto:", error);

      setActionError(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o produto.",
      );
    } finally {
      setActingProductId(null);
    }
  }

  return (
    <section>
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
            Administração
          </p>

          <h1 className="mt-3 text-4xl font-semibold text-stone-950">
            Produtos
          </h1>

          <p className="mt-3 max-w-2xl text-stone-600">
            Cadastre, consulte, edite e organize os produtos do catálogo.
          </p>
        </div>

        <Link
          to="/admin/produtos/novo"
          className="inline-flex min-h-12 items-center justify-center rounded-lg bg-stone-900 px-4 py-3 text-center text-sm font-medium text-white hover:bg-stone-700"
        >
          Novo produto
        </Link>
      </header>

      {!actionError && (successMessage || navigationNotice) && (
        <div
          role="status"
          className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
        >
          {successMessage || navigationNotice}
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {actionError}
        </div>
      )}

      <form
        onSubmit={handleFilterSubmit}
        className="mt-8 rounded-2xl border border-stone-200 bg-white p-5"
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_220px_180px_auto]">
          <div>
            <label
              htmlFor="product-search"
              className="mb-2 block text-sm font-medium text-stone-700"
            >
              Pesquisar
            </label>

            <input
              id="product-search"
              type="search"
              value={draftFilters.search}
              onChange={(event) =>
                setDraftFilters((currentFilters) => ({
                  ...currentFilters,
                  search: event.target.value,
                }))
              }
              placeholder="Nome do produto"
              className="w-full rounded-lg border border-stone-300 px-4 py-3 outline-none transition focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10"
            />
          </div>

          <div>
            <label
              htmlFor="product-category-filter"
              className="mb-2 block text-sm font-medium text-stone-700"
            >
              Categoria
            </label>

            <select
              id="product-category-filter"
              value={draftFilters.categoryId}
              onChange={(event) =>
                setDraftFilters((currentFilters) => ({
                  ...currentFilters,
                  categoryId: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10"
            >
              <option value="">Todas</option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nome}
                  {!category.ativa ? " — inativa" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="product-status-filter"
              className="mb-2 block text-sm font-medium text-stone-700"
            >
              Status
            </label>

            <select
              id="product-status-filter"
              value={draftFilters.status}
              onChange={(event) =>
                setDraftFilters((currentFilters) => ({
                  ...currentFilters,
                  status: event.target.value as ProductStatus | "",
                }))
              }
              className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10"
            >
              <option value="">Todos</option>

              <option value="rascunho">Rascunho</option>

              <option value="publicado">Publicado</option>

              <option value="arquivado">Arquivado</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="min-h-12 flex-1 rounded-lg bg-stone-900 px-4 py-3 text-sm font-medium text-white hover:bg-stone-700 lg:flex-none"
            >
              Filtrar
            </button>

            <button
              type="button"
              onClick={clearFilters}
              className="min-h-12 flex-1 rounded-lg border border-stone-300 px-4 py-3 text-sm font-medium text-stone-700 hover:bg-stone-100 lg:flex-none"
            >
              Limpar
            </button>
          </div>
        </div>
      </form>

      <div className="mt-6">
        {isLoading && (
          <div
            className="rounded-2xl border border-stone-200 bg-white p-12 text-center text-stone-600"
            aria-live="polite"
          >
            Carregando produtos...
          </div>
        )}

        {!isLoading && loadError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-sm text-red-800">{loadError}</p>

            <button
              type="button"
              onClick={() => void reload()}
              className="mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-800 transition hover:bg-red-100"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!isLoading && !loadError && products.length === 0 && (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
            <h2 className="font-semibold text-stone-900">
              Nenhum produto encontrado
            </h2>

            <p className="mt-2 text-sm text-stone-600">
              Ainda não existem produtos ou nenhum produto corresponde aos
              filtros informados.
            </p>

            <Link
              to="/admin/produtos/novo"
              className="mt-5 inline-flex rounded-lg bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-700"
            >
              Cadastrar produto
            </Link>
          </div>
        )}

        {!isLoading && !loadError && products.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
            <div className="border-b border-stone-200 px-5 py-4">
              <p className="text-sm text-stone-600">
                {products.length}{" "}
                {products.length === 1
                  ? "produto encontrado"
                  : "produtos encontrados"}
              </p>
            </div>

            <div className="divide-y divide-stone-200 lg:hidden">
              {products.map((product) => {
                const isActing = actingProductId === product.id;
                return (
                  <article key={product.id} className="p-4 sm:p-5">
                    <h2 className="text-lg font-semibold text-stone-950">{product.nome}</h2>
                    <p className="mt-1 text-sm text-stone-600">{product.categoria?.nome ?? "Categoria indisponível"}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={["inline-flex rounded-full px-3 py-1 text-xs font-medium", getStatusClasses(product.status)].join(" ")}>
                        {getStatusLabel(product.status)}
                      </span>
                      <span className={[
                        "inline-flex rounded-full px-3 py-1 text-xs font-medium",
                        product.disponivel ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800",
                      ].join(" ")}>
                        {product.disponivel ? "Disponível" : "Indisponível"}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-stone-500">Atualizado em {formatDate(product.updated_at)}</p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Link to={`/admin/produtos/${product.id}/editar`} className="inline-flex min-h-11 items-center justify-center rounded-md bg-stone-900 px-3 py-2 text-sm font-medium text-white">
                        Editar
                      </Link>
                      {product.status === "arquivado" ? (
                        <button type="button" onClick={() => void handleRestore(product)} disabled={isActing} className="min-h-11 rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-800 disabled:opacity-50">
                          {isActing ? "Aguarde..." : "Restaurar"}
                        </button>
                      ) : (
                        <button type="button" onClick={() => void handleArchive(product)} disabled={isActing} className="min-h-11 rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-800 disabled:opacity-50">
                          {isActing ? "Aguarde..." : "Arquivar"}
                        </button>
                      )}
                      {product.status === "arquivado" && (
                        <button type="button" onClick={() => void handleDelete(product)} disabled={isActing} className="col-span-2 min-h-11 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 disabled:opacity-50">
                          {isActing ? "Aguarde..." : "Excluir definitivamente"}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="hidden lg:block">
            <ResponsiveTableRegion label="Lista administrativa de produtos">
              <table className="w-full min-w-[980px] border-collapse text-left">
                <thead className="bg-stone-50">
                  <tr>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-stone-500">
                      Produto
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-stone-500">
                      Categoria
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-stone-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-stone-500">
                      Disponibilidade
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-stone-500">
                      Atualizado
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-stone-500">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-200">
                  {products.map((product) => {
                    const isActing = actingProductId === product.id;

                    return (
                      <tr key={product.id}>
                        <td className="px-5 py-4">
                          <p className="font-medium text-stone-950">
                            {product.nome}
                          </p>

                          <p className="mt-1 text-xs text-stone-500">
                            /produto/{product.slug}
                          </p>

                          {product.descricao_curta && (
                            <p className="mt-2 max-w-md text-sm text-stone-600">
                              {product.descricao_curta}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-stone-700">
                          {product.categoria?.nome ?? "Categoria indisponível"}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={[
                              "inline-flex rounded-full px-3 py-1 text-xs font-medium",
                              getStatusClasses(product.status),
                            ].join(" ")}
                          >
                            {getStatusLabel(product.status)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={[
                              "inline-flex rounded-full px-3 py-1 text-xs font-medium",
                              product.disponivel
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800",
                            ].join(" ")}
                          >
                            {product.disponivel ? "Disponível" : "Indisponível"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-stone-600">
                          {formatDate(product.updated_at)}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Link
                              to={`/admin/produtos/${product.id}/editar`}
                              className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-medium text-stone-700 transition hover:bg-stone-100"
                            >
                              Editar
                            </Link>

                            {product.status === "arquivado" ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => void handleRestore(product)}
                                  disabled={isActing}
                                  className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-medium text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isActing ? "Aguarde..." : "Restaurar"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => void handleDelete(product)}
                                  disabled={isActing}
                                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isActing ? "Aguarde..." : "Excluir"}
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => void handleArchive(product)}
                                disabled={isActing}
                                className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-medium text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isActing ? "Arquivando..." : "Arquivar"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ResponsiveTableRegion>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
