import { describe, expect, it, vi } from "vitest";

vi.mock("../../../lib/supabase", () => ({ supabase: {} }));

import { validateProductImage, ProductImageValidationError } from "./productImageService";

describe("validateProductImage", () => {
  it("rejects a file whose content disagrees with its MIME type", async () => {
    const file = new File(["not a JPEG"], "fake.jpg", { type: "image/jpeg" });
    await expect(validateProductImage(file)).rejects.toBeInstanceOf(ProductImageValidationError);
  });

  it("accepts a JPEG signature", async () => {
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00])], "valid.jpg", { type: "image/jpeg" });
    await expect(validateProductImage(file)).resolves.toBeUndefined();
  });
});
