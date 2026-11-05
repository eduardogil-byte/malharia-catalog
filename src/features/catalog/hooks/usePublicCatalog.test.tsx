import { act, fireEvent, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { listPublicProducts, listPublicCategories } = vi.hoisted(() => ({
  listPublicProducts: vi.fn().mockResolvedValue([]),
  listPublicCategories: vi.fn().mockResolvedValue([]),
}));

vi.mock("../services/publicCatalogService", () => ({
  listPublicProducts,
  listPublicCategories,
  PUBLIC_CATALOG_PAGE_SIZE: 12,
}));
vi.mock("../services/signProductImage", () => ({
  SIGNED_IMAGE_REFRESH_MS: 45 * 60 * 1000,
}));

import { usePublicCatalog } from "./usePublicCatalog";

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("usePublicCatalog", () => {
  it("refreshes image URLs before their expiry", async () => {
    vi.useFakeTimers();
    renderHook(() => usePublicCatalog({ search: "", categoryId: "" }));
    expect(listPublicProducts).toHaveBeenCalledTimes(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(45 * 60 * 1000);
    });
    expect(listPublicProducts).toHaveBeenCalledTimes(2);
  });

  it("refreshes when a suspended tab becomes visible", async () => {
    renderHook(() => usePublicCatalog({ search: "", categoryId: "" }));
    expect(listPublicProducts).toHaveBeenCalledTimes(1);
    await act(async () => { fireEvent(document, new Event("visibilitychange")); });
    expect(listPublicProducts).toHaveBeenCalledTimes(2);
  });

  it("loads the next page without duplicating the first products", async () => {
    listPublicProducts
      .mockResolvedValueOnce(Array.from({ length: 13 }, (_, index) => ({ id: String(index) })))
      .mockResolvedValueOnce([{ id: "12" }, { id: "13" }]);
    const filters = { search: "", categoryId: "" };
    const { result } = renderHook(() => usePublicCatalog(filters));

    await waitFor(() => expect(result.current.products).toHaveLength(12));
    expect(result.current.hasMore).toBe(true);
    await act(async () => { await result.current.loadMore(); });

    expect(result.current.products.map((product) => product.id)).toEqual(
      Array.from({ length: 14 }, (_, index) => String(index)),
    );
    expect(result.current.hasMore).toBe(false);
    expect(listPublicProducts).toHaveBeenNthCalledWith(1, filters, 0, 13);
    expect(listPublicProducts).toHaveBeenNthCalledWith(2, filters, 12, 13);
  });
});
