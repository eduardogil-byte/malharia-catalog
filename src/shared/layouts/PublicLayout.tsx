import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { PublicFooter } from "../../components/public/PublicFooter";
import { PublicHeader } from "../../components/public/PublicHeader";
import { PublicSiteSettingsProvider, usePublicSiteSettings } from "../../features/site-settings/context/PublicSiteSettingsContext";
import { RouteFocusManager } from "../components/RouteFocusManager";
import { SkipLink } from "../components/SkipLink";

function PublicLayoutContent() {
  const location = useLocation();
  const { settings } = usePublicSiteSettings();

  useEffect(() => {
    if (location.pathname.startsWith("/produto/")) return;
    const brand = settings?.nomeMarca?.trim() || "Malharia Catalog";
    const section = location.pathname === "/catalogo" ? "Catálogo"
      : location.pathname === "/sobre" ? "Sobre"
      : location.pathname === "/contato" ? "Contato" : "Início";
    const title = `${section} | ${brand}`;
    document.title = title;
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", title);
  }, [location.pathname, settings?.nomeMarca]);

  return (
    <div className="public-site flex min-h-screen flex-col bg-white text-stone-950">
      <SkipLink />

      <RouteFocusManager />

      <PublicHeader />

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 outline-none"
      >
        <Outlet />
      </main>

      <PublicFooter />
    </div>
  );
}

export function PublicLayout() {
  return (
    <PublicSiteSettingsProvider>
      <PublicLayoutContent />
    </PublicSiteSettingsProvider>
  );
}
