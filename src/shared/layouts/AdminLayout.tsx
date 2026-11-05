import { NavLink, Outlet } from "react-router";
import { useState } from "react";
import { useAuth } from "../../features/auth/hooks/useAuth";

const adminNavigationItems = [
  { label: "Visão geral", to: "/admin", end: true },
  { label: "Produtos", to: "/admin/produtos", end: false },
  { label: "Categorias", to: "/admin/categorias", end: false },
  { label: "Página inicial", to: "/admin/pagina-inicial", end: false },
  { label: "Configurações", to: "/admin/configuracoes", end: false },
];

export function AdminLayout() {
  const { user, signOut } = useAuth();

  const [isSigningOut, setIsSigningOut] = useState(false);

  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    setLogoutError(null);
    setIsSigningOut(true);

    try {
      await signOut();
    } catch (error) {
      console.error("Erro ao encerrar sessão:", error);

      setLogoutError("Não foi possível sair. Tente novamente.");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="flex items-center gap-4">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-stone-900">Administrador</p>

            <p className="text-xs text-stone-500">{user?.email}</p>
          </div>

          <NavLink
            to="/"
            className="text-sm font-medium text-stone-600 hover:text-stone-950"
          >
            Ver site
          </NavLink>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSigningOut ? "Saindo..." : "Sair"}
          </button>
        </div>
      </header>

      {logoutError && (
        <div
          role="alert"
          className="mx-auto mt-4 max-w-7xl px-4 text-sm text-red-700 sm:px-6 lg:px-8"
        >
          {logoutError}
        </div>
      )}

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8">
        <aside className="rounded-2xl border border-stone-200 bg-white p-4">
          <nav aria-label="Navegação administrativa">
            <ul className="space-y-1">
              {adminNavigationItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      [
                        "block rounded-lg px-3 py-2 text-sm font-medium transition",
                        isActive
                          ? "bg-stone-900 text-white"
                          : "text-stone-600 hover:bg-stone-100 hover:text-stone-950",
                      ].join(" ")
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
