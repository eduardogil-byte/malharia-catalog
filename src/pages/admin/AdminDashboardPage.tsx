import { Link } from "react-router";

const dashboardItems = [
  {
    title: "Produtos",
    description: "Cadastre produtos, adicione fotos e escolha o que fica publicado.",
    to: "/admin/produtos",
    action: "Gerenciar produtos",
  },
  {
    title: "Categorias",
    description: "Organize malhas, sabonetes, velas e aromatizadores.",
    to: "/admin/categorias",
    action: "Organizar categorias",
  },
  {
    title: "Página inicial",
    description: "Escolha os produtos que aparecem em destaque na vitrine.",
    to: "/admin/pagina-inicial",
    action: "Editar destaques",
  },
  {
    title: "Informações da loja",
    description: "Atualize a marca, os contatos e as imagens da página inicial.",
    to: "/admin/configuracoes",
    action: "Editar informações",
  },
];

export function AdminDashboardPage() {
  return (
    <section>
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold text-stone-950 sm:text-4xl">O que você quer fazer?</h1>
        <p className="mt-3 text-base leading-7 text-stone-600">
          Escolha uma área para cuidar do catálogo. As mudanças só aparecem para os clientes quando um produto é publicado.
        </p>
      </header>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:gap-5">
        {dashboardItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex min-h-48 flex-col rounded-md border border-stone-200 bg-white p-5 hover:border-stone-500 hover:shadow-soft sm:p-6"
          >
            <h2 className="text-xl font-semibold text-stone-950">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">{item.description}</p>
            <span className="mt-auto pt-5 text-sm font-semibold text-stone-800 underline underline-offset-4">{item.action}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
