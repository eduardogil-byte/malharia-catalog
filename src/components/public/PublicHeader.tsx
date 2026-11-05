import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { usePublicSiteSettings } from "../../features/site-settings/context/PublicSiteSettingsContext";
import { createGeneralWhatsAppUrl } from "../../features/site-settings/utils/publicContactLinks";

const navigationItems = [
  { label: "Início", to: "/", end: true },
  { label: "Catálogo", to: "/catalogo", end: false },
  { label: "Sobre", to: "/sobre", end: false },
  { label: "Contato", to: "/contato", end: false },
];

export function PublicHeader() {
  const { settings } = usePublicSiteSettings();
  const location = useLocation();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [openPath, setOpenPath] = useState<string | null>(null);
  const isMenuOpen = openPath === location.pathname;
  const brandName = settings?.nomeMarca?.trim() || "Minha Marca";
  const whatsappUrl = createGeneralWhatsAppUrl(
    settings?.whatsapp ?? null,
    `Olá! Gostaria de conhecer os produtos da ${brandName}.`,
  );

  function closeMenu() {
    setOpenPath(null);
  }

  useEffect(() => {
    if (!isMenuOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
        window.requestAnimationFrame(() => menuButtonRef.current?.focus());
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur-lg">
      <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          onClick={closeMenu}
          aria-label={`${brandName} — página inicial`}
          className="flex min-w-0 items-center rounded-sm"
        >
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt="" className="h-10 w-auto max-w-40 object-contain sm:h-11 sm:max-w-48" />
          ) : (
            <span className="truncate font-display text-2xl tracking-[-0.03em] text-stone-950 sm:text-[1.8rem]">
              {brandName}
            </span>
          )}
        </Link>

        <nav aria-label="Navegação principal" className="hidden items-center gap-6 md:flex lg:gap-9">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => [
                "border-b-2 px-1 py-2 text-sm font-medium",
                isActive
                  ? "border-stone-900 text-stone-950"
                  : "border-transparent text-stone-600 hover:border-stone-400 hover:text-stone-950",
              ].join(" ")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:block">
          {whatsappUrl ? (
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="button-primary min-h-11 px-4 lg:px-5">
              Falar pelo WhatsApp
            </a>
          ) : (
            <Link to="/contato" className="button-primary min-h-11 px-4 lg:px-5">Entrar em contato</Link>
          )}
        </div>

        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setOpenPath(isMenuOpen ? null : location.pathname)}
          aria-expanded={isMenuOpen}
          aria-controls="public-mobile-menu"
          aria-label={isMenuOpen ? "Fechar menu principal" : "Abrir menu principal"}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-800 hover:border-stone-700 hover:bg-stone-50 md:hidden"
        >
          {isMenuOpen ? "Fechar" : "Menu"}
        </button>
      </div>

      {isMenuOpen && (
        <div id="public-mobile-menu" className="max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-stone-200 bg-white px-4 py-4 shadow-float md:hidden">
          <nav aria-label="Navegação para dispositivos móveis" className="mx-auto flex max-w-7xl flex-col gap-1">
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={closeMenu}
                className={({ isActive }) => [
                  "flex min-h-12 items-center rounded-md px-4 py-3 text-base font-medium",
                  isActive ? "bg-stone-100 text-stone-950" : "text-stone-700 hover:bg-stone-50",
                ].join(" ")}
              >
                {item.label}
              </NavLink>
            ))}
            {whatsappUrl ? (
              <a href={whatsappUrl} target="_blank" rel="noreferrer" onClick={closeMenu} className="button-primary mt-4 w-full">
                Falar pelo WhatsApp
              </a>
            ) : (
              <Link to="/contato" onClick={closeMenu} className="button-primary mt-4 w-full">Entrar em contato</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
