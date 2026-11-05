import { Link } from "react-router";
import { usePublicSiteSettings } from "../../features/site-settings/context/PublicSiteSettingsContext";
import {
  createGeneralWhatsAppUrl,
  createInstagramUrl,
  getInstagramLabel,
} from "../../features/site-settings/utils/publicContactLinks";

const defaultContactText =
  "Entre em contato para consultar disponibilidade, medidas, materiais, aromas e outras informações sobre os produtos.";

export function ContactPage() {
  const { settings, isLoading, loadError, reload } = usePublicSiteSettings();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-stone-600 sm:px-6 lg:px-8">
        Carregando contatos...
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

  const whatsappUrl = createGeneralWhatsAppUrl(
    settings?.whatsapp ?? null,
    `Olá! Gostaria de conhecer os produtos da ${brandName}.`,
  );

  const instagramUrl = createInstagramUrl(settings?.instagram ?? null);

  const contactText = settings?.textoContato?.trim() || defaultContactText;

  const hasContactInformation =
    Boolean(whatsappUrl) ||
    Boolean(instagramUrl) ||
    Boolean(settings?.email) ||
    Boolean(settings?.endereco);

  return (
    <div>
      <section className="bg-stone-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-400">
            Atendimento
          </p>

          <h1 className="mt-4 text-5xl leading-none sm:text-6xl">
            Entre em contato
          </h1>

          <p className="mt-7 max-w-2xl whitespace-pre-line text-lg leading-8 text-stone-300">
            {contactText}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-28">
        {hasContactInformation ? (
          <div className="grid gap-px overflow-hidden rounded-lg border border-stone-200 bg-stone-200 md:grid-cols-2">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-white p-7 transition hover:bg-green-50 sm:p-9"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.15em] text-green-700">
                  WhatsApp
                </p>

                <h2 className="mt-4 text-3xl leading-tight text-stone-950">
                  Fale diretamente conosco
                </h2>

                <p className="mt-3 text-sm leading-6 text-stone-600">
                  Consulte produtos, disponibilidade e outras informações.
                </p>

                <span className="mt-6 inline-flex font-semibold text-green-700">
                  Iniciar conversa →
                </span>
              </a>
            )}

            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-white p-7 transition hover:bg-stone-50 sm:p-9"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.15em] text-stone-500">
                  Instagram
                </p>

                <h2 className="mt-4 text-3xl leading-tight text-stone-950">
                  {getInstagramLabel(settings?.instagram ?? null)}
                </h2>

                <p className="mt-3 text-sm leading-6 text-stone-600">
                  Acompanhe novidades, produtos e conteúdos da marca.
                </p>

                <span className="mt-6 inline-flex font-semibold text-stone-900">
                  Abrir Instagram →
                </span>
              </a>
            )}

            {settings?.email && (
              <a
                href={`mailto:${settings.email}`}
                className="bg-white p-7 transition hover:bg-stone-50 sm:p-9"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.15em] text-stone-500">
                  E-mail
                </p>

                <h2 className="mt-4 break-all font-sans text-xl font-semibold tracking-normal text-stone-950">
                  {settings.email}
                </h2>

                <p className="mt-3 text-sm leading-6 text-stone-600">
                  Envie uma mensagem por e-mail.
                </p>
              </a>
            )}

            {settings?.endereco && (
              <article className="bg-white p-7 sm:p-9">
                <p className="text-sm font-semibold uppercase tracking-[0.15em] text-stone-500">
                  Endereço
                </p>

                <p className="mt-3 whitespace-pre-line text-lg leading-8 text-stone-700">
                  {settings.endereco}
                </p>
              </article>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-300 p-12 text-center">
            <h2 className="text-2xl font-semibold text-stone-950">
              Contatos em atualização
            </h2>

            <p className="mt-3 text-stone-600">
              Os canais de atendimento ainda não foram configurados.
            </p>
          </div>
        )}

        <div className="mt-16 border-y border-stone-200 bg-stone-50 p-8 text-center sm:p-14">
          <h2 className="text-4xl text-stone-950">
            Veja também nosso catálogo
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-stone-600">
            Consulte as malhas e os produtos artesanais disponíveis.
          </p>

          <Link
            to="/catalogo"
            className="button-primary mt-8"
          >
            Abrir catálogo
          </Link>
        </div>
      </section>
    </div>
  );
}
