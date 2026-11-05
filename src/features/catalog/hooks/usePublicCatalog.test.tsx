import { act, fireEvent, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { listPublicProducts, listPublicCategories } = vi.hoisted(() => ({
  listPublicProducts: vi.fn().mockResolvedValue([]),
  listPublicCategories: vi.fn().mockResolvedValue([]),
}));

vi.mock("../services/publicCatalogService", () => ({
  listPublicProducts,
  listPublicCategories,
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
});
