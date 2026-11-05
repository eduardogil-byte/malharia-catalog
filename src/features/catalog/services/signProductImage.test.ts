import { describe, expect, it, vi } from "vitest";

const { createSignedUrl } = vi.hoisted(() => ({
  createSignedUrl: vi.fn().mockResolvedValue({
    data: { signedUrl: "https://example.test/signed-image" },
    error: null,
  }),
}));

vi.mock("../../../lib/supabase", () => ({
  supabase: { storage: { from: () => ({ createSignedUrl }) } },
}));

import { signProductImage, SIGNED_IMAGE_REFRESH_MS } from "./signProductImage";

describe("signed product images", () => {
  it("requests a signed URL for the requested image", async () => {
    await expect(signProductImage("produtos/id/photo.jpg"))
      .resolves.toBe("https://example.test/signed-image");
    expect(createSignedUrl).toHaveBeenCalledWith("produtos/id/photo.jpg", 3600);
  });

  it("refreshes before the signed URL expires", () => {
    expect(SIGNED_IMAGE_REFRESH_MS).toBeLessThan(3600 * 1000);
  });
});
