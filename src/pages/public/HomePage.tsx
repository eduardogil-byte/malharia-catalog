import { Link } from "react-router";
import { PublicHomeSection } from "../../features/home/components/PublicHomeSection";
import { usePublicHome } from "../../features/home/hooks/usePublicHome";
import { usePublicSiteSettings } from "../../features/site-settings/context/PublicSiteSettingsContext";
import { createGeneralWhatsAppUrl } from "../../features/site-settings/utils/publicContactLinks";

export function HomePage() {
  const { sections, categories, isLoading, loadError, reload } = usePublicHome();
  const { settings } = usePublicSiteSettings();
  const brandName = settings?.nomeMarca?.trim() || "Nossa marca";
  const whatsappUrl = createGeneralWhatsAppUrl(
    settings?.whatsapp ?? null,
    `Olá! Gostaria de conhecer os produtos da ${brandName}.`,
  );
  const heroTitle = settings?.slogan?.trim() ||
    "Malhas e pequenos cuidados feitos para acompanhar o seu dia.";

  return (
    <div>
      <section className="bg-stone-950 text-white">
        <div className="mx-auto grid max-w-7xl lg:min-h-[34rem] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="flex flex-col justify-center px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
            <p className="text-sm font-medium text-stone-200">{brandName}</p>
            <h1 className="mt-5 max-w-3xl text-[clamp(2.7rem,6vw,5.5rem)] leading-[1.02]">
              {heroTitle}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-stone-200 sm:text-lg sm:leading-8">
              Roupas de malha, sabonetes, velas e aromatizadores para conhecer
              com calma. Escolha o que combina com você e converse diretamente
              pelo WhatsApp.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/catalogo"
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-white px-7 py-3 text-sm font-semibold text-stone-950 hover:bg-stone-100"
              >
                Explorar o catálogo
              </Link>
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/65 px-7 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Conversar pelo WhatsApp
                </a>
              ) : (
                <Link
                  to="/contato"
                  className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/65 px-7 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Entrar em contato
                </Link>
              )}
            </div>
          </div>
          {settings?.bannerUrl && (
            <div className="aspect-[4/3] overflow-hidden bg-stone-800 lg:aspect-auto">
              <img
                src={settings.bannerUrl}
                alt={`Seleção de produtos da ${brandName}`}
                fetchPriority="high"
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>
      </section>

      {categories.length > 0 && (
        <section aria-labelledby="home-categories-heading" className="border-b border-stone-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="home-categories-heading" className="text-3xl leading-tight text-stone-950 sm:text-4xl">
                Encontre por categoria
              </h2>
              <Link to="/catalogo" className="text-sm font-semibold text-stone-800 underline underline-offset-4 hover:text-stone-950">
                Ver todos os produtos
              </Link>
            </div>
            <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/catalogo?categoria=${encodeURIComponent(category.id)}`}
                  className="flex min-h-28 flex-col justify-between rounded-md border border-stone-200 bg-stone-50 p-4 hover:border-stone-500 hover:bg-stone-100 sm:p-5"
                >
                  <span className="font-display text-xl leading-tight text-stone-950 sm:text-2xl">{category.nome}</span>
                  <span className="mt-4 text-sm font-medium text-stone-700">Ver produtos</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {isLoading && (
        <section aria-live="polite" className="mx-auto max-w-7xl px-4 py-20 text-center text-stone-600 sm:px-6 lg:px-8">
          Carregando produtos em destaque...
        </section>
      )}
      {!isLoading && loadError && (
        <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-8">
            <p className="text-sm text-red-800">{loadError}</p>
            <button type="button" onClick={() => void reload()} className="button-secondary mt-5">
              Tentar novamente
            </button>
          </div>
        </section>
      )}
      {!isLoading && !loadError && sections.map((section, index) => (
        <PublicHomeSection key={section.id} section={section} mutedBackground={index % 2 !== 0} />
      ))}
      {!isLoading && !loadError && sections.length === 0 && (
        <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl text-stone-950 sm:text-4xl">Nosso catálogo está sendo preparado</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-stone-600">
            Volte em breve para conhecer os produtos. Você também pode entrar em contato para saber mais.
          </p>
          <Link to="/catalogo" className="button-primary mt-7">Acessar catálogo</Link>
        </section>
      )}

      <section className="bg-stone-100">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl leading-tight text-stone-950 sm:text-4xl">
              Ficou com alguma dúvida?
            </h2>
            <p className="mt-4 leading-7 text-stone-700">
              Pergunte sobre tecidos, medidas, aromas ou disponibilidade. O atendimento é direto e pessoal.
            </p>
          </div>
          {whatsappUrl ? (
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="button-primary w-full shrink-0 sm:w-auto">
              Falar pelo WhatsApp
            </a>
          ) : (
            <Link to="/contato" className="button-primary w-full shrink-0 sm:w-auto">Entrar em contato</Link>
          )}
        </div>
      </section>
    </div>
  );
}
