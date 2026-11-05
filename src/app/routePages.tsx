import { lazy } from "react";

export const CatalogPage = lazy(() => import("../pages/public/CatalogPage").then((module) => ({ default: module.CatalogPage })));
export const ProductPage = lazy(() => import("../pages/public/ProductPage").then((module) => ({ default: module.ProductPage })));
export const AboutPage = lazy(() => import("../pages/public/AboutPage").then((module) => ({ default: module.AboutPage })));
export const ContactPage = lazy(() => import("../pages/public/ContactPage").then((module) => ({ default: module.ContactPage })));
export const NotFoundPage = lazy(() => import("../pages/public/NotFoundPage").then((module) => ({ default: module.NotFoundPage })));
export const AdminLoginPage = lazy(() => import("../pages/admin/AdminLoginPage").then((module) => ({ default: module.AdminLoginPage })));
export const AdminDashboardPage = lazy(() => import("../pages/admin/AdminDashboardPage").then((module) => ({ default: module.AdminDashboardPage })));
export const ProductsPage = lazy(() => import("../pages/admin/ProductsPage").then((module) => ({ default: module.ProductsPage })));
export const ProductFormPage = lazy(() => import("../pages/admin/ProductFormPage").then((module) => ({ default: module.ProductFormPage })));
export const CategoriesPage = lazy(() => import("../pages/admin/CategoriesPage").then((module) => ({ default: module.CategoriesPage })));
export const HomeSectionsPage = lazy(() => import("../pages/admin/HomeSectionsPage").then((module) => ({ default: module.HomeSectionsPage })));
export const HomeSectionProductsPage = lazy(() => import("../pages/admin/HomeSectionProductsPage").then((module) => ({ default: module.HomeSectionProductsPage })));
export const SiteSettingsPage = lazy(() => import("../pages/admin/SiteSettingsPage").then((module) => ({ default: module.SiteSettingsPage })));
export const AdminNotFoundPage = lazy(() => import("../pages/admin/AdminNotFoundPage").then((module) => ({ default: module.AdminNotFoundPage })));
