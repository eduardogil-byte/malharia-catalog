import { Link } from "react-router";
import type { PublicProduct } from "../types/publicCatalog";

type PublicProductCardProps = {
  product: PublicProduct;
};

export function PublicProductCard({ product }: PublicProductCardProps) {
  const coverImage = product.imagens[0];

  return (
    <article className="group h-full">
      <Link
        to={`/produto/${product.slug}`}
        aria-label={`Ver detalhes do produto ${product.nome}`}
        className="flex h-full flex-col rounded-md focus-visible:outline-offset-4"
      >
        <div className="aspect-[4/5] overflow-hidden rounded-sm bg-stone-100">
          {coverImage ? (
            <img
              src={coverImage.publicUrl}
              alt={coverImage.altText ?? product.nome}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-stone-500">
              Produto sem imagem
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col border-b border-stone-200 pb-3 pt-3 sm:pt-4">
          {product.categoria && (
            <p className="text-xs font-medium text-stone-600">
              {product.categoria.nome}
            </p>
          )}

          <h2 className="mt-1.5 font-sans text-base font-semibold leading-snug tracking-normal text-stone-950 sm:text-lg">
            {product.nome}
          </h2>

          {product.descricaoCurta && (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">
              {product.descricaoCurta}
            </p>
          )}

          {!product.disponivel && (
            <span className="mt-3 inline-flex self-start rounded-sm bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900">
              Temporariamente indisponível
            </span>
          )}

          <span className="mt-auto inline-flex min-h-11 items-end self-start pt-3 text-sm font-semibold text-stone-800 underline decoration-stone-400 underline-offset-4 group-hover:decoration-stone-900">
            Ver detalhes
          </span>
        </div>
      </Link>
    </article>
  );
}
