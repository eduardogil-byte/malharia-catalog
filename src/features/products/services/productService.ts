import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";
import type {
  Product,
  ProductListFilters,
  ProductStatus,
  ProductWithCategory,
  ProductWriteInput,
} from "../types/product";

export class ProductConflictError extends Error {
  constructor() {
    super(
      "Já existe um produto com esse nome na categoria ou com esse endereço.",
    );

    this.name = "ProductConflictError";
  }
}

export class ProductPermissionError extends Error {
  constructor() {
    super("Você não possui permissão para realizar essa operação.");

    this.name = "ProductPermissionError";
  }
}

export class ProductNotFoundError extends Error {
  constructor() {
    super("O produto não foi encontrado.");
    this.name = "ProductNotFoundError";
  }
}

export class ProductDeleteRequiresArchiveError extends Error {
  constructor() {
    super("O produto precisa ser arquivado antes da exclusão definitiva.");

    this.name = "ProductDeleteRequiresArchiveError";
  }
}

export class ProductHasImagesError extends Error {
  constructor() {
    super("Remova todas as imagens do produto antes da exclusão.");

    this.name = "ProductHasImagesError";
  }
}

export class ProductPersistenceError extends Error {
  constructor(message = "Não foi possível realizar a operação com o produto.") {
    super(message);
    this.name = "ProductPersistenceError";
  }
}

function mapProductError(error: PostgrestError): Error {
  console.error("Erro recebido do Supabase ao manipular produtos:", error);

  switch (error.code) {
    case "23505":
      return new ProductConflictError();

    case "23503":
      return new ProductHasImagesError();

    case "42501":
      return new ProductPermissionError();

    case "P0002":
      return new ProductNotFoundError();

    case "22023":
      if (error.message.toLocaleLowerCase("pt-BR").includes("arquivado")) {
        return new ProductDeleteRequiresArchiveError();
      }

      return new ProductPersistenceError("Os dados informados são inválidos.");

    case "23514":
      return new ProductPersistenceError(
        error.message || "Os dados informados não atendem às regras do produto.",
      );

    default:
      return new ProductPersistenceError();
  }
}

function createProductPayload(input: ProductWriteInput) {
  return {
    categoria_id: input.categoriaId,
    nome: input.nome,
    slug: input.slug,
    descricao_curta: input.descricaoCurta,
    descricao: input.descricao,
    status: input.status,
    disponivel: input.disponivel,
    atributos: input.atributos,
    mensagem_whatsapp: input.mensagemWhatsapp,
  };
}

export async function listProductsAdmin(
  filters: ProductListFilters,
): Promise<ProductWithCategory[]> {
  let query = supabase
    .from("produtos")
    .select(
      `
      *,
      categoria:categorias!produtos_categoria_id_fkey (
        id,
        nome,
        slug
      )
    `,
    )
    .order("updated_at", {
      ascending: false,
    });

  const searchTerm = filters.search.trim();

  if (searchTerm) {
    query = query.ilike("nome", `%${searchTerm}%`);
  }

  if (filters.categoryId) {
    query = query.eq("categoria_id", filters.categoryId);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) {
    throw mapProductError(error);
  }

  return data as ProductWithCategory[];
}

export async function getProductAdmin(productId: string): Promise<Product> {
  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    throw mapProductError(error);
  }

  if (!data) {
    throw new ProductNotFoundError();
  }

  return data;
}

export async function createProduct(
  input: ProductWriteInput,
): Promise<Product> {
  const { data, error } = await supabase
    .from("produtos")
    .insert(createProductPayload(input))
    .select("*")
    .single();

  if (error) {
    throw mapProductError(error);
  }

  return data;
}

export async function updateProduct(
  productId: string,
  input: ProductWriteInput,
): Promise<Product> {
  const { data, error } = await supabase
    .from("produtos")
    .update(createProductPayload(input))
    .eq("id", productId)
    .select("*")
    .single();

  if (error) {
    throw mapProductError(error);
  }

  return data;
}

export async function setProductStatus(
  productId: string,
  status: ProductStatus,
): Promise<Product> {
  const { data, error } = await supabase
    .from("produtos")
    .update({
      status,
    })
    .eq("id", productId)
    .select("*")
    .single();

  if (error) {
    throw mapProductError(error);
  }

  return data;
}

export async function deleteArchivedProduct(productId: string): Promise<void> {
  const { error } = await supabase.rpc("excluir_produto_arquivado", {
    p_produto_id: productId,
  });

  if (error) {
    throw mapProductError(error);
  }
}
