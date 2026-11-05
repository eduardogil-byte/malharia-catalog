import { Suspense, type ReactNode } from "react";
import { createBrowserRouter } from "react-router";
import { HomePage } from "../pages/public/HomePage";
import { AdminLayout } from "../shared/layouts/AdminLayout";
import { PublicLayout } from "../shared/layouts/PublicLayout";
import { AdminProtectedRoute } from "../features/auth/components/AdminProtectedRoute";
import { RouteErrorPage } from "../components/shared/RouteErrorPage";
import {
  AboutPage, AdminDashboardPage, AdminLoginPage, AdminNotFoundPage,
  CatalogPage, CategoriesPage, ContactPage, HomeSectionProductsPage,
  HomeSectionsPage, NotFoundPage, ProductFormPage, ProductPage,
  ProductsPage, SiteSettingsPage,
} from "./routePages";

function page(content: ReactNode) {
  return <Suspense fallback={<div role="status" className="p-8 text-center text-sm text-stone-600">Carregando página...</div>}>{content}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "catalogo",
        element: page(<CatalogPage />),
      },
      {
        path: "produto/:slug",
        element: page(<ProductPage />),
      },
      {
        path: "sobre",
        element: page(<AboutPage />),
      },
      {
        path: "contato",
        element: page(<ContactPage />),
      },
    ],
  },
  {
    path: "/admin/login",
    element: page(<AdminLoginPage />),
  },
  {
    element: <AdminProtectedRoute />,
    children: [
      {
        path: "/admin",
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: page(<AdminDashboardPage />),
          },
          {
            path: "produtos",
            element: page(<ProductsPage />),
          },
          {
            path: "produtos/novo",
            element: page(<ProductFormPage />),
          },
          {
            path: "produtos/:productId/editar",
            element: page(<ProductFormPage />),
          },
          {
            path: "categorias",
            element: page(<CategoriesPage />),
          },
          {
            path: "pagina-inicial",
            element: page(<HomeSectionsPage />),
          },
          {
            path: "pagina-inicial/:sectionId/produtos",
            element: page(<HomeSectionProductsPage />),
          },
          {
            path: "configuracoes",
            element: page(<SiteSettingsPage />),
          },
          {
            path: "*",
            element: page(<AdminNotFoundPage />),
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: page(<NotFoundPage />),
  },
]);
