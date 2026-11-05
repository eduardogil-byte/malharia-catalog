import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";
import type { ProductImage } from "../types/productImage";
import { PRODUCT_IMAGES_BUCKET } from "../../../shared/constants/storage";
import { hasImageSignature } from "../../../shared/utils/hasImageSignature";

export const MAX_PRODUCT_IMAGES = 8;

export const MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024;
export const MAX_SOURCE_IMAGE_SIZE = 20 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;

const imageExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export class ProductImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductImageValidationError";
  }
}

export class ProductImagePersistenceError extends Error {
  constructor(message = "Não foi possível realizar a operação com a imagem.") {
    super(message);
    this.name = "ProductImagePersistenceError";
  }
}

function mapDatabaseError(error: PostgrestError): Error {
  console.error("Erro do banco ao manipular imagem:", error);

  switch (error.code) {
    case "42501":
      return new ProductImagePersistenceError(
        "Você não possui permissão para gerenciar imagens.",
      );

    case "P0002":
      return new ProductImagePersistenceError(
        "A imagem ou o produto não foi encontrado.",
      );

    case "22023":
      return new ProductImagePersistenceError(
        error.message || "Os dados da imagem são inválidos.",
      );

    case "23505":
      return new ProductImagePersistenceError(
        "Esta imagem já está cadastrada.",
      );

    case "23514":
      return new ProductImagePersistenceError(error.message);

    default:
      return new ProductImagePersistenceError();
  }
}

export async function validateProductImage(
  file: File,
  maxSize = MAX_PRODUCT_IMAGE_SIZE,
): Promise<void> {
  if (!imageExtensions[file.type]) {
    throw new ProductImageValidationError(
      `O arquivo "${file.name}" não possui um formato permitido.`,
    );
  }

  if (file.size > maxSize) {
    throw new ProductImageValidationError(
      `O arquivo "${file.name}" ultrapassa o limite de ${maxSize / (1024 * 1024)} MB.`,
    );
  }

  if (file.size === 0) {
    throw new ProductImageValidationError(
      `O arquivo "${file.name}" está vazio.`,
    );
  }

  if (!await hasImageSignature(file)) {
    throw new ProductImageValidationError(`O conteúdo de "${file.name}" não corresponde ao formato informado.`);
  }
}

export async function prepareProductImage(file: File): Promise<File> {
  await validateProductImage(file, MAX_SOURCE_IMAGE_SIZE);

  if (typeof createImageBitmap !== "function") {
    await validateProductImage(file);
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new ProductImageValidationError(`Não foi possível abrir a imagem "${file.name}".`);
  }

  try {
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new ProductImageValidationError("Não foi possível preparar a imagem neste navegador.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const optimized = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", 0.82);
    });
    if (optimized?.type === "image/webp" && optimized.size > 0 && optimized.size < file.size && optimized.size <= MAX_PRODUCT_IMAGE_SIZE) {
      const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
      const webpFile = new File([optimized], name, { type: "image/webp" });
      await validateProductImage(webpFile);
      return webpFile;
    }
  } finally {
    bitmap.close();
  }

  await validateProductImage(file);
  return file;
}

function createStoragePath(productId: string, file: File): string {
  const extension = imageExtensions[file.type];

  return ["produtos", productId, `${crypto.randomUUID()}.${extension}`].join(
    "/",
  );
}

export async function listProductImages(
  productId: string,
): Promise<ProductImage[]> {
  const { data, error } = await supabase
    .from("produto_imagens")
    .select("*")
    .eq("produto_id", productId)
    .order("posicao", {
      ascending: true,
    });

  if (error) {
    throw mapDatabaseError(error);
  }

  return Promise.all(data.map(async (image) => {
    const { data: signed, error: signError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET).createSignedUrl(image.storage_path, 3600);
    if (signError) throw new ProductImagePersistenceError("Não foi possível carregar a imagem.");
    return { ...image, publicUrl: signed.signedUrl };
  }));
}

async function registerProductImage(
  productId: string,
  storagePath: string,
  altText: string,
): Promise<void> {
  const { error } = await supabase.rpc("registrar_imagem_produto", {
    p_produto_id: productId,
    p_storage_path: storagePath,
    p_alt_text: altText || undefined, //aqui foi necessario mudar de null para undefined, pois estava com erro
  });

  if (error) {
    throw mapDatabaseError(error);
  }
}

export async function uploadProductImages(
  productId: string,
  files: File[],
  existingImagesCount: number,
  onProgress?: (current: number, total: number, stage: "preparing" | "uploading") => void,
): Promise<void> {
  if (files.length === 0) {
    throw new ProductImageValidationError("Selecione pelo menos uma imagem.");
  }

  if (existingImagesCount + files.length > MAX_PRODUCT_IMAGES) {
    throw new ProductImageValidationError(
      `O produto pode possuir no máximo ${MAX_PRODUCT_IMAGES} imagens.`,
    );
  }

  const preparedFiles: File[] = [];
  for (const [index, file] of files.entries()) {
    onProgress?.(index + 1, files.length, "preparing");
    preparedFiles.push(await prepareProductImage(file));
  }

  /*
   * Enviamos sequencialmente para que as posições sejam
   * registradas na mesma ordem em que os arquivos foram
   * selecionados.
   */
  for (const [index, file] of preparedFiles.entries()) {
    onProgress?.(index + 1, preparedFiles.length, "uploading");
    const storagePath = createStoragePath(productId, file);

    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(storagePath, file, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Erro no upload da imagem:", uploadError);

      throw new ProductImagePersistenceError(
        `Não foi possível enviar "${file.name}".`,
      );
    }

    try {
      await registerProductImage(productId, storagePath, file.name);
    } catch (error) {
      /*
       * Se o registro no banco falhar, removemos o arquivo
       * recém-enviado para evitar um objeto órfão.
       */
      const { error: cleanupError } = await supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .remove([storagePath]);

      if (cleanupError) {
        console.error(
          "Não foi possível remover o arquivo após falha:",
          cleanupError,
        );
      }

      throw error;
    }
  }
}

export async function deleteProductImage(image: ProductImage): Promise<void> {
  const { error: databaseError } = await supabase.rpc(
    "excluir_imagem_produto",
    {
      p_imagem_id: image.id,
    },
  );

  if (databaseError) {
    throw mapDatabaseError(databaseError);
  }

  const { error: storageError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET).remove([image.storage_path]);
  if (storageError) {
    console.error("Arquivo órfão após excluir registro da imagem:", storageError);
    throw new ProductImagePersistenceError(
      "A imagem saiu do produto, mas o arquivo permaneceu no Storage. Execute a auditoria de órfãos.",
    );
  }
}

export async function reorderProductImages(
  productId: string,
  imageIds: string[],
): Promise<void> {
  if (imageIds.length === 0) {
    throw new ProductImageValidationError(
      "A lista de imagens não pode estar vazia.",
    );
  }

  const { error } = await supabase.rpc("reordenar_imagens_produto", {
    p_produto_id: productId,
    p_imagem_ids: imageIds,
  });

  if (error) {
    throw mapDatabaseError(error);
  }
}
