import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  deleteProductImage,
  listProductImages,
  MAX_PRODUCT_IMAGES,
  reorderProductImages,
  uploadProductImages,
} from "../services/productImageService";
import type { ProductImage } from "../types/productImage";
import { SIGNED_IMAGE_REFRESH_MS } from "../../catalog/services/signProductImage";

type ProductImagesManagerProps = {
  productId: string;
};

type MoveDirection = "up" | "down";

function normalizeImagePositions(images: ProductImage[]): ProductImage[] {
  return images.map((image, index) => ({
    ...image,
    posicao: index + 1,
  }));
}

export function ProductImagesManager({ productId }: ProductImagesManagerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [images, setImages] = useState<ProductImage[]>([]);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [isUploading, setIsUploading] = useState(false);

  const [isReordering, setIsReordering] = useState(false);

  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadImages = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await listProductImages(productId);

      setImages(data);
    } catch (error) {
      console.error("Erro ao carregar imagens:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar as imagens.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void loadImages();
    const timer = window.setInterval(() => { void loadImages(); }, SIGNED_IMAGE_REFRESH_MS);
    const onVisible = () => { if (!document.hidden) void loadImages(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadImages]);

  function clearMessages() {
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function handleFilesChange(event: ChangeEvent<HTMLInputElement>) {
    clearMessages();

    const files = Array.from(event.target.files ?? []);

    setSelectedFiles(files);
  }

  async function handleUpload() {
    if (isUploading || isReordering) {
      return;
    }

    clearMessages();
    setIsUploading(true);

    try {
      await uploadProductImages(productId, selectedFiles, images.length);

      setSelectedFiles([]);

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      await loadImages();

      setSuccessMessage("Imagens enviadas com sucesso.");
    } catch (error) {
      console.error("Erro ao enviar imagens:", error);

      await loadImages();

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar as imagens.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function persistImageOrder(
    nextImages: ProductImage[],
    message: string,
  ) {
    if (isReordering || isUploading || deletingImageId) {
      return;
    }

    const previousImages = images;

    const normalizedImages = normalizeImagePositions(nextImages);

    clearMessages();
    setIsReordering(true);

    /*
     * Atualização otimista:
     * a interface muda antes da resposta do banco.
     */
    setImages(normalizedImages);

    try {
      await reorderProductImages(
        productId,
        normalizedImages.map((image) => image.id),
      );

      setSuccessMessage(message);
    } catch (error) {
      console.error("Erro ao reordenar imagens:", error);

      // Restaura a ordem anterior.
      setImages(previousImages);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível alterar a ordem das imagens.",
      );
    } finally {
      setIsReordering(false);
    }
  }

  async function handleMove(imageId: string, direction: MoveDirection) {
    const currentIndex = images.findIndex((image) => image.id === imageId);

    if (currentIndex === -1) {
      return;
    }

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= images.length) {
      return;
    }

    const reorderedImages = [...images];

    [reorderedImages[currentIndex], reorderedImages[targetIndex]] = [
      reorderedImages[targetIndex],
      reorderedImages[currentIndex],
    ];

    await persistImageOrder(reorderedImages, "Ordem das imagens atualizada.");
  }

  async function handleSetAsCover(image: ProductImage) {
    if (image.posicao === 1) {
      return;
    }

    const reorderedImages = [
      image,
      ...images.filter((currentImage) => currentImage.id !== image.id),
    ];

    await persistImageOrder(reorderedImages, "Imagem definida como capa.");
  }

  async function handleDelete(image: ProductImage) {
    if (isReordering || isUploading || deletingImageId) {
      return;
    }

    const confirmed = window.confirm(
      image.posicao === 1
        ? "Esta é a imagem de capa. Deseja excluí-la? A próxima imagem se tornará a capa."
        : "Deseja excluir esta imagem?",
    );

    if (!confirmed) {
      return;
    }

    clearMessages();
    setDeletingImageId(image.id);

    try {
      await deleteProductImage(image);
      await loadImages();

      setSuccessMessage("Imagem excluída com sucesso.");
    } catch (error) {
      console.error("Erro ao excluir imagem:", error);

      await loadImages();

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir a imagem.",
      );
    } finally {
      setDeletingImageId(null);
    }
  }

  const remainingSlots = MAX_PRODUCT_IMAGES - images.length;

  const interactionsDisabled =
    isUploading || isReordering || deletingImageId !== null;

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6">
      <div>
        <h2 className="text-xl font-semibold text-stone-950">
          Imagens do produto
        </h2>

        <p className="mt-1 text-sm leading-6 text-stone-600">
          Envie até {MAX_PRODUCT_IMAGES} imagens. A imagem na posição 1 será
          utilizada como capa do produto.
        </p>
      </div>

      {successMessage && (
        <div
          role="status"
          className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
        >
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {errorMessage}
        </div>
      )}

      {isReordering && (
        <p role="status" className="mt-5 text-sm font-medium text-stone-600">
          Salvando a nova ordem...
        </p>
      )}

      <div className="mt-6 rounded-xl border border-dashed border-stone-300 p-5">
        <label
          htmlFor="product-images"
          className="block text-sm font-medium text-stone-700"
        >
          Selecionar imagens
        </label>

        <input
          ref={inputRef}
          id="product-images"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFilesChange}
          disabled={interactionsDisabled || remainingSlots === 0}
          className="mt-3 block w-full text-sm text-stone-600 file:mr-4 file:rounded-lg file:border-0 file:bg-stone-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-stone-700 disabled:opacity-50"
        />

        <p className="mt-3 text-xs text-stone-500">
          JPEG, PNG ou WebP. Máximo de 5 MB por arquivo. Restam {remainingSlots}{" "}
          espaços.
        </p>

        {selectedFiles.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-stone-700">
              Arquivos selecionados:
            </p>

            <ul className="mt-2 space-y-1 text-sm text-stone-600">
              {selectedFiles.map((file) => (
                <li key={`${file.name}-${file.lastModified}`}>{file.name}</li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => void handleUpload()}
              disabled={interactionsDisabled}
              className="mt-4 rounded-lg bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUploading
                ? "Enviando..."
                : `Enviar ${selectedFiles.length} imagem(ns)`}
            </button>
          </div>
        )}
      </div>

      <div className="mt-6">
        {isLoading && (
          <div className="rounded-lg bg-stone-50 p-8 text-center text-sm text-stone-600">
            Carregando imagens...
          </div>
        )}

        {!isLoading && images.length === 0 && (
          <div className="rounded-lg border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">
            Nenhuma imagem cadastrada.
          </div>
        )}

        {!isLoading && images.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {images.map((image, index) => {
              const isDeleting = deletingImageId === image.id;

              return (
                <article
                  key={image.id}
                  className="overflow-hidden rounded-xl border border-stone-200"
                >
                  <div className="relative aspect-square bg-stone-100">
                    <img
                      src={image.publicUrl}
                      alt={image.alt_text ?? "Imagem do produto"}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />

                    {image.posicao === 1 && (
                      <span className="absolute left-3 top-3 rounded-full bg-stone-950 px-3 py-1 text-xs font-medium text-white">
                        Capa
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <p className="text-sm font-medium text-stone-900">
                      Imagem {image.posicao}
                    </p>

                    {image.alt_text && (
                      <p className="mt-1 truncate text-xs text-stone-500">
                        {image.alt_text}
                      </p>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => void handleMove(image.id, "up")}
                        disabled={interactionsDisabled || index === 0}
                        className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-medium text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Mover para cima
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleMove(image.id, "down")}
                        disabled={
                          interactionsDisabled || index === images.length - 1
                        }
                        className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-medium text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Mover para baixo
                      </button>
                    </div>

                    {image.posicao !== 1 && (
                      <button
                        type="button"
                        onClick={() => void handleSetAsCover(image)}
                        disabled={interactionsDisabled}
                        className="mt-2 w-full rounded-lg bg-stone-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Definir como capa
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => void handleDelete(image)}
                      disabled={interactionsDisabled}
                      className="mt-2 w-full rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isDeleting ? "Excluindo..." : "Excluir imagem"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
