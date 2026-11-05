import { supabase } from "../../../lib/supabase";
import { PRODUCT_IMAGES_BUCKET } from "../../../shared/constants/storage";

export const SIGNED_IMAGE_REFRESH_MS = 45 * 60 * 1000;

export async function signProductImage(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET).createSignedUrl(storagePath, 3600);
  if (error) throw new Error("Não foi possível carregar a imagem do produto.");
  return data.signedUrl;
}
