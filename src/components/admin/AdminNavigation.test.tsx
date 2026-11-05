import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../test/renderWithRouter";
import { AdminNavigation } from "./AdminNavigation";

describe("AdminNavigation", () => {
  it("exibe os links administrativos", () => {
    renderWithRouter(<AdminNavigation />, {
      initialEntries: ["/admin/produtos"],
    });

    expect(
      screen.getByRole("link", {
        name: "Visão geral",
      }),
    ).toHaveAttribute("href", "/admin");

    expect(
      screen.getByRole("link", {
        name: "Produtos",
      }),
    ).toHaveAttribute("href", "/admin/produtos");

    expect(
      screen.getByRole("link", {
        name: "Categorias",
      }),
    ).toHaveAttribute("href", "/admin/categorias");
  });

  it("indica a rota administrativa ativa", () => {
    renderWithRouter(<AdminNavigation />, {
      initialEntries: ["/admin/produtos"],
    });

    expect(
      screen.getByRole("link", {
        name: "Produtos",
      }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("executa o logout", async () => {
    const handleLogout = vi.fn();

    const { user } = renderWithRouter(
      <AdminNavigation onLogout={handleLogout} />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Sair do painel",
      }),
    );

    expect(handleLogout).toHaveBeenCalledTimes(1);
  });

  it("bloqueia o botão durante o logout", () => {
    renderWithRouter(<AdminNavigation onLogout={vi.fn()} isLoggingOut />);

    expect(
      screen.getByRole("button", {
        name: "Saindo...",
      }),
    ).toBeDisabled();
  });
});
