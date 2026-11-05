import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../lib/supabase", () => ({ supabase: {} }));

import { prepareProductImage, validateProductImage, ProductImageValidationError } from "./productImageService";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

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

describe("prepareProductImage", () => {
  it("resizes a large image proportionally and uploads a smaller WebP", async () => {
    const source = new File([
      new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, ...new Array<number>(512).fill(0)]),
    ], "foto.png", { type: "image/png" });
    const close = vi.fn();
    const drawImage = vi.fn();
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width: 3200, height: 1600, close }));
    vi.spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) => {
      callback(new Blob([new TextEncoder().encode("RIFF0000WEBP")], { type: "image/webp" }));
    });

    const result = await prepareProductImage(source);

    expect(result.name).toBe("foto.webp");
    expect(result.type).toBe("image/webp");
    expect(result.size).toBeLessThan(source.size);
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1600, 800);
    expect(close).toHaveBeenCalledOnce();
  });
});
