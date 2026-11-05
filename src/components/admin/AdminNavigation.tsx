import { Link, NavLink } from "react-router";

type AdminNavigationProps = {
  onNavigate?: () => void;
  onLogout?: () => void | Promise<void>;
  isLoggingOut?: boolean;
};

const navigationItems = [
  {
    label: "Visão geral",
    to: "/admin",
    end: true,
  },
  {
    label: "Produtos",
    to: "/admin/produtos",
    end: false,
  },
  {
    label: "Categorias",
    to: "/admin/categorias",
    end: false,
  },
  {
    label: "Página inicial",
    to: "/admin/pagina-inicial",
    end: false,
  },
  {
    label: "Configurações",
    to: "/admin/configuracoes",
    end: false,
  },
];

export function AdminNavigation({
  onNavigate,
  onLogout,
  isLoggingOut = false,
}: AdminNavigationProps) {
  return (
    <div className="flex h-full flex-col">
      <nav aria-label="Navegação administrativa" className="space-y-1.5">
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              [
                "flex min-h-11 items-center rounded-md border-l-2 px-4 py-3 text-sm font-medium transition",
                isActive
                  ? "border-stone-950 bg-stone-950 text-white shadow-soft"
                  : "border-transparent text-stone-700 hover:border-stone-300 hover:bg-stone-100 hover:text-stone-950",
              ].join(" ")
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-stone-200 pt-5">
        <Link
          to="/"
          onClick={onNavigate}
          className="flex min-h-11 items-center rounded-md px-4 py-3 text-sm font-medium text-stone-700 hover:bg-stone-100 hover:text-stone-950"
        >
          Ver site público
        </Link>

        {onLogout && (
          <button
            type="button"
            onClick={() => {
              void onLogout();
            }}
            disabled={isLoggingOut}
            className="mt-1 flex min-h-11 w-full items-center rounded-md px-4 py-3 text-left text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoggingOut ? "Saindo..." : "Sair do painel"}
          </button>
        )}
      </div>
    </div>
  );
}
