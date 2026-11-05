import { Link } from "react-router";
import { usePublicSiteSettings } from "../../features/site-settings/context/PublicSiteSettingsContext";

const defaultAboutText = `Trabalhamos com malhas e produtos artesanais selecionados com cuidado.

Nosso objetivo é oferecer um atendimento próximo e ajudar cada cliente a encontrar produtos adequados para suas necessidades e projetos.`;

export function AboutPage() {
  const { settings, isLoading, loadError, reload } = usePublicSiteSettings();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-stone-600 sm:px-6 lg:px-8">
        Carregando informações...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8">
          <p className="text-red-800">{loadError}</p>

          <button
            type="button"
            onClick={() => void reload()}
            className="mt-5 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-800"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const brandName = settings?.nomeMarca?.trim() || "Nossa marca";

  const aboutText = settings?.textoSobre?.trim() || defaultAboutText;

  return (
    <div>
      <section className="bg-stone-50">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:px-8 lg:py-28">
          <div>
            <p className="eyebrow">
              Nossa história
            </p>

            <h1 className="mt-4 text-5xl leading-[1.02] text-stone-950 sm:text-6xl">
              Sobre a {brandName}
            </h1>

            {settings?.slogan && (
              <p className="mt-6 max-w-lg text-lg leading-8 text-stone-600">
                {settings.slogan}
              </p>
            )}
          </div>

          <div className="flex min-h-80 items-center justify-center overflow-hidden rounded-lg border border-stone-200 bg-white p-10 shadow-soft sm:min-h-96">
            {settings?.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={brandName}
                className="max-h-56 max-w-full object-contain"
              />
            ) : (
              <p className="font-display text-4xl tracking-[-0.03em] text-stone-950">
                {brandName}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <h2 className="text-4xl text-stone-950 sm:text-5xl">Quem somos</h2>

        <div className="mt-8 whitespace-pre-line text-lg leading-9 text-stone-600">
          {aboutText}
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/catalogo"
            className="button-primary"
          >
            Conhecer os produtos
          </Link>

          <Link
            to="/contato"
            className="button-secondary"
          >
            Entrar em contato
          </Link>
        </div>
      </section>
    </div>
  );
}
