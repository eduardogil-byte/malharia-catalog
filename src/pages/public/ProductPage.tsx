import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { PublicProductGallery } from "../../features/catalog/components/PublicProductGallery";
import { getPublicProductBySlug } from "../../features/catalog/services/publicCatalogService";
import type { PublicProduct } from "../../features/catalog/types/publicCatalog";
import { createWhatsAppUrl } from "../../features/catalog/utils/createWhatsAppUrl";
import { getProductAttributes } from "../../features/catalog/utils/getProductAttributes";
import { usePublicSiteSettings } from "../../features/site-settings/context/PublicSiteSettingsContext";
import { SIGNED_IMAGE_REFRESH_MS } from "../../features/catalog/services/signProductImage";

export function ProductPage() {
  const { slug } = useParams<{
    slug: string;
  }>();

  const { settings } = usePublicSiteSettings();

  const [product, setProduct] = useState<PublicProduct | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      if (!slug) {
        setLoadError("O endereço do produto é inválido.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const productData = await getPublicProductBySlug(slug);

        if (cancelled) {
          return;
        }

        setProduct(productData);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Erro ao carregar produto:", error);

        setLoadError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o produto.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadProduct();

    const timer = window.setInterval(() => { void loadProduct(); }, SIGNED_IMAGE_REFRESH_MS);
    const onVisible = () => { if (!document.hidden) void loadProduct(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [slug]);

  const attributes = useMemo(
    () => (product ? getProductAttributes(product.atributos) : []),
    [product],
  );

  if (isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16 text-center text-stone-600 sm:px-6 lg:px-8">
        Carregando produto...
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-red-700">{loadError}</p>

        <Link
          to="/catalogo"
          className="mt-6 inline-flex rounded-lg bg-stone-900 px-5 py-3 text-sm font-medium text-white"
        >
          Voltar ao catálogo
        </Link>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold text-stone-950">
          Produto não encontrado
        </h1>

        <p className="mt-3 text-stone-600">
          O produto pode ter sido removido ou ainda não está publicado.
        </p>

        <Link
          to="/catalogo"
          className="mt-6 inline-flex rounded-lg bg-stone-900 px-5 py-3 text-sm font-medium text-white"
        >
          Voltar ao catálogo
        </Link>
      </main>
    );
  }

  const whatsappUrl = settings?.whatsapp
    ? createWhatsAppUrl({
        phoneNumber: settings.whatsapp,
        productName: product.nome,
        customMessage: product.mensagemWhatsapp,
        productUrl: window.location.href,
      })
    : null;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
      <nav
        aria-label="Navegação estrutural"
        className="mb-8 text-xs font-medium uppercase tracking-[0.1em] text-stone-500 lg:mb-10"
      >
        <Link to="/catalogo" className="hover:text-stone-950">
          Catálogo
        </Link>

        {product.categoria && (
          <>
            <span aria-hidden="true">{" / "}</span>

            <span>{product.categoria.nome}</span>
          </>
        )}
      </nav>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:gap-16 xl:gap-24">
        <PublicProductGallery
          productName={product.nome}
          images={product.imagens}
        />

        <section className="lg:sticky lg:top-32 lg:self-start">
          {product.categoria && (
            <p className="eyebrow">
              {product.categoria.nome}
            </p>
          )}

          <h1 className="mt-4 text-5xl leading-[1.02] text-stone-950 sm:text-6xl">
            {product.nome}
          </h1>

          {!product.disponivel && (
            <span className="mt-6 inline-flex rounded-sm bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-800">
              Temporariamente indisponível
            </span>
          )}

          {product.descricaoCurta && (
            <p className="mt-7 text-lg leading-8 text-stone-600">
              {product.descricaoCurta}
            </p>
          )}

          {attributes.length > 0 && (
            <div className="mt-8">
              <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-stone-950">
                Características
              </h2>

              <dl className="mt-4 divide-y divide-stone-200 border-y border-stone-200">
                {attributes.map((attribute) => (
                  <div
                    key={attribute.name}
                    className="grid grid-cols-2 gap-4 py-3.5"
                  >
                    <dt className="text-sm font-medium text-stone-700">
                      {attribute.name}
                    </dt>

                    <dd className="text-sm text-stone-600">
                      {attribute.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="button-primary mt-9 flex w-full"
            >
              Consultar pelo WhatsApp
            </a>
          )}

          {!settings?.whatsapp && (
            <p className="mt-8 rounded-lg bg-stone-100 px-4 py-3 text-sm text-stone-600">
              O contato pelo WhatsApp ainda não foi configurado.
            </p>
          )}
        </section>
      </div>

      {product.descricao && (
        <section className="mt-16 max-w-4xl border-t border-stone-200 pt-12 lg:mt-24 lg:pt-16">
          <h2 className="text-3xl text-stone-950 sm:text-4xl">
            Sobre este produto
          </h2>

          <p className="mt-6 whitespace-pre-line text-base leading-8 text-stone-600">
            {product.descricao}
          </p>
        </section>
      )}
    </main>
  );
}
