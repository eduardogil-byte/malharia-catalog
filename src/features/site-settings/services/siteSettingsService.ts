import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";
import { SITE_ASSETS_BUCKET } from "../../../shared/constants/siteAssets";
import { hasImageSignature } from "../../../shared/utils/hasImageSignature";
import type {
  SiteAssetKind,
  SiteSettings,
  SiteSettingsRow,
  SiteSettingsWriteInput,
} from "../types/siteSettings";

const MAX_SITE_ASSET_SIZE = 5 * 1024 * 1024;

const imageExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type SettingsDatabaseRow = Pick<
  SiteSettingsRow,
  | "id"
  | "nome_marca"
  | "slogan"
  | "whatsapp"
  | "instagram"
  | "email"
  | "endereco"
  | "texto_sobre"
  | "texto_contato"
  | "logo_path"
  | "banner_path"
  | "updated_at"
>;

export class SiteSettingsPermissionError extends Error {
  constructor() {
    super("Você não possui permissão para alterar as configurações.");

    this.name = "SiteSettingsPermissionError";
  }
}

export class SiteSettingsNotFoundError extends Error {
  constructor() {
    super("As configurações do site não foram encontradas.");

    this.name = "SiteSettingsNotFoundError";
  }
}

export class SiteSettingsValidationError extends Error {
  constructor(message: string) {
    super(message);

    this.name = "SiteSettingsValidationError";
  }
}

export class SiteSettingsPersistenceError extends Error {
  constructor(message = "Não foi possível salvar as configurações do site.") {
    super(message);

    this.name = "SiteSettingsPersistenceError";
  }
}

function mapDatabaseError(error: PostgrestError): Error {
  console.error("Erro ao manipular configurações:", error);

  switch (error.code) {
    case "42501":
      return new SiteSettingsPermissionError();

    case "P0002":
      return new SiteSettingsNotFoundError();

    case "23514":
    case "22023":
      return new SiteSettingsPersistenceError(
        error.message || "Os dados informados são inválidos.",
      );

    default:
      return new SiteSettingsPersistenceError();
  }
}

function getAssetPublicUrl(storagePath: string | null): string | null {
  if (!storagePath) {
    return null;
  }

  const { data } = supabase.storage
    .from(SITE_ASSETS_BUCKET)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

function mapSiteSettings(row: SettingsDatabaseRow): SiteSettings {
  return {
    id: row.id,
    nomeMarca: row.nome_marca,
    slogan: row.slogan,
    whatsapp: row.whatsapp,
    instagram: row.instagram,
    email: row.email,
    endereco: row.endereco,
    textoSobre: row.texto_sobre,
    textoContato: row.texto_contato,
    logoPath: row.logo_path,
    bannerPath: row.banner_path,
    logoUrl: getAssetPublicUrl(row.logo_path),
    bannerUrl: getAssetPublicUrl(row.banner_path),
    updatedAt: row.updated_at,
  };
}

function createSettingsPayload(input: SiteSettingsWriteInput) {
  return {
    nome_marca: input.nomeMarca,
    slogan: input.slogan,
    whatsapp: input.whatsapp,
    instagram: input.instagram,
    email: input.email,
    endereco: input.endereco,
    texto_sobre: input.textoSobre,
    texto_contato: input.textoContato,
  };
}

export async function getSiteSettingsAdmin(): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from("configuracoes_site")
    .select(
      `
      id,
      nome_marca,
      slogan,
      whatsapp,
      instagram,
      email,
      endereco,
      texto_sobre,
      texto_contato,
      logo_path,
      banner_path,
      updated_at
    `,
    )
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    throw mapDatabaseError(error);
  }

  if (!data) {
    throw new SiteSettingsNotFoundError();
  }

  return mapSiteSettings(data as SettingsDatabaseRow);
}

export async function getPublicSiteSettings(): Promise<SiteSettings | null> {
  const { data, error } = await supabase
    .from("configuracoes_site")
    .select(
      `
      id,
      nome_marca,
      slogan,
      whatsapp,
      instagram,
      email,
      endereco,
      texto_sobre,
      texto_contato,
      logo_path,
      banner_path,
      updated_at
    `,
    )
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    throw mapDatabaseError(error);
  }

  if (!data) {
    return null;
  }

  return mapSiteSettings(data as SettingsDatabaseRow);
}

export async function updateSiteSettings(
  input: SiteSettingsWriteInput,
): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from("configuracoes_site")
    .update(createSettingsPayload(input))
    .eq("id", 1)
    .select(
      `
      id,
      nome_marca,
      slogan,
      whatsapp,
      instagram,
      email,
      endereco,
      texto_sobre,
      texto_contato,
      logo_path,
      banner_path,
      updated_at
    `,
    )
    .single();

  if (error) {
    throw mapDatabaseError(error);
  }

  return mapSiteSettings(data as SettingsDatabaseRow);
}

async function validateSiteAsset(file: File): Promise<void> {
  if (!imageExtensions[file.type]) {
    throw new SiteSettingsValidationError(
      `O arquivo "${file.name}" deve ser JPEG, PNG ou WebP.`,
    );
  }

  if (file.size === 0) {
    throw new SiteSettingsValidationError(
      `O arquivo "${file.name}" está vazio.`,
    );
  }

  if (file.size > MAX_SITE_ASSET_SIZE) {
    throw new SiteSettingsValidationError(
      `O arquivo "${file.name}" ultrapassa o limite de 5 MB.`,
    );
  }
  if (!await hasImageSignature(file)) {
    throw new SiteSettingsValidationError(`O conteúdo de "${file.name}" não corresponde ao formato informado.`);
  }
}

function createAssetPath(kind: SiteAssetKind, file: File): string {
  const extension = imageExtensions[file.type];

  return ["marca", `${kind}-${crypto.randomUUID()}.${extension}`].join("/");
}

async function updateAssetPath(
  kind: SiteAssetKind,
  path: string | null,
): Promise<SiteSettings> {
  const payload =
    kind === "logo"
      ? {
          logo_path: path,
        }
      : {
          banner_path: path,
        };

  const { data, error } = await supabase
    .from("configuracoes_site")
    .update(payload)
    .eq("id", 1)
    .select(
      `
      id,
      nome_marca,
      slogan,
      whatsapp,
      instagram,
      email,
      endereco,
      texto_sobre,
      texto_contato,
      logo_path,
      banner_path,
      updated_at
    `,
    )
    .single();

  if (error) {
    throw mapDatabaseError(error);
  }

  return mapSiteSettings(data as SettingsDatabaseRow);
}

async function removeStorageFile(storagePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(SITE_ASSETS_BUCKET)
    .remove([storagePath]);

  if (error) {
    throw new SiteSettingsPersistenceError(
      "Não foi possível remover o arquivo anterior.",
    );
  }
}

export async function uploadSiteAsset(
  kind: SiteAssetKind,
  file: File,
  currentPath: string | null,
): Promise<SiteSettings> {
  await validateSiteAsset(file);

  const newPath = createAssetPath(kind, file);

  const { error: uploadError } = await supabase.storage
    .from(SITE_ASSETS_BUCKET)
    .upload(newPath, file, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Erro ao enviar imagem institucional:", uploadError);

    throw new SiteSettingsPersistenceError(
      `Não foi possível enviar "${file.name}".`,
    );
  }

  let updatedSettings: SiteSettings;

  try {
    updatedSettings = await updateAssetPath(kind, newPath);
  } catch (error) {
    const { error: cleanupError } = await supabase.storage
      .from(SITE_ASSETS_BUCKET)
      .remove([newPath]);

    if (cleanupError) {
      console.error("Erro ao limpar arquivo após falha:", cleanupError);
    }

    throw error;
  }

  if (currentPath && currentPath !== newPath) {
    try {
      await removeStorageFile(currentPath);
    } catch (error) {
      /*
       * A configuração nova já foi salva.
       * A falha ao excluir o arquivo antigo não
       * deve impedir o uso da nova imagem.
       */
      console.error("Não foi possível excluir a imagem anterior:", error);
    }
  }

  return updatedSettings;
}

export async function removeSiteAsset(
  kind: SiteAssetKind,
  currentPath: string | null,
): Promise<SiteSettings> {
  const updatedSettings = await updateAssetPath(kind, null);

  if (currentPath) {
    try {
      await removeStorageFile(currentPath);
    } catch (error) {
      console.error(
        "A configuração foi removida, mas o arquivo antigo permaneceu no Storage:",
        error,
      );
    }
  }

  return updatedSettings;
}
