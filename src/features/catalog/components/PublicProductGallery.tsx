import { useState } from "react";
import type { PublicProductImage } from "../types/publicCatalog";

type PublicProductGalleryProps = {
  productName: string;
  images: PublicProductImage[];
};

export function PublicProductGallery({ productName, images }: PublicProductGalleryProps) {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const selectedIndex = Math.max(0, images.findIndex((image) => image.id === selectedImageId));
  const selectedImage = images[selectedIndex];

  if (!selectedImage) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center rounded-md bg-stone-100 p-8 text-center text-stone-600">
        Produto sem imagens
      </div>
    );
  }

  return (
    <div>
      <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-md bg-stone-100">
        <img
          src={selectedImage.publicUrl}
          alt={selectedImage.altText ?? productName}
          decoding="async"
          className="h-full w-full object-contain"
        />
      </div>
      {images.length > 1 && (
        <>
          <div className="mt-3 flex items-center justify-between gap-4 text-sm text-stone-600">
            <span aria-live="polite">Foto {selectedIndex + 1} de {images.length}</span>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setSelectedImageId(images[(selectedIndex - 1 + images.length) % images.length].id)}
                className="min-h-11 font-medium text-stone-800 underline underline-offset-4"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setSelectedImageId(images[(selectedIndex + 1) % images.length].id)}
                className="min-h-11 font-medium text-stone-800 underline underline-offset-4"
              >
                Próxima
              </button>
            </div>
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-2" role="group" aria-label={`Fotos de ${productName}`}>
            {images.map((image, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setSelectedImageId(image.id)}
                  aria-label={`Visualizar imagem ${index + 1} de ${productName}`}
                  aria-pressed={isSelected}
                  className={[
                    "aspect-square w-16 shrink-0 overflow-hidden rounded-sm border-2 bg-stone-100 sm:w-20",
                    isSelected ? "border-stone-900" : "border-transparent hover:border-stone-500",
                  ].join(" ")}
                >
                  <img src={image.publicUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
