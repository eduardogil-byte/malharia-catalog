import { supabase } from "../../../lib/supabase";
import { signProductImage } from "../../catalog/services/signProductImage";
import type { Json } from "../../../types/database.types";
import type {
  PublicProduct,
  PublicProductCategory,
  PublicProductImage,
} from "../../catalog/types/publicCatalog";
import type { PublicHomeSection } from "../types/publicHome";

type HomeSectionDatabaseRow = {
  id: string;
  titulo: string;
  subtitulo: string | null;
  slug: string;
  posicao: number;
  limite_produtos: number;
};

type ProductImageDatabaseRow = {
  id: string;
  storage_path: string;
  alt_text: string | null;
  posicao: number;
};

type HomeProductDatabaseRow = {
  id: string;
  categoria_id: string;
  nome: string;
  slug: string;
  descricao_curta: string | null;
  descricao: string | null;
  disponivel: boolean;
  atributos: Json;
  mensagem_whatsapp: string | null;
  status: string;
  categoria: PublicProductCategory | null;
  imagens: ProductImageDatabaseRow[] | null;
};

type HomeSectionProductDatabaseRow = {
  secao_id: string;
  posicao: number;
  produtos: HomeProductDatabaseRow | null;
};

export class PublicHomeError extends Error {
  constructor(message = "Não foi possível carregar a página inicial.") {
    super(message);
    this.name = "PublicHomeError";
  }
}

async function mapProductImage(image: ProductImageDatabaseRow): Promise<PublicProductImage> {
  return {
    id: image.id,
    storagePath: image.storage_path,
    altText: image.alt_text,
    posicao: image.posicao,
    publicUrl: await signProductImage(image.storage_path),
  };
}

async function mapPublicProduct(product: HomeProductDatabaseRow): Promise<PublicProduct> {
  const images = await Promise.all((product.imagens ?? [])
    .slice()
    .sort((firstImage, secondImage) => firstImage.posicao - secondImage.posicao)
    .map(mapProductImage));

  return {
    id: product.id,
    categoriaId: product.categoria_id,
    nome: product.nome,
    slug: product.slug,
    descricaoCurta: product.descricao_curta,
    descricao: product.descricao,
    disponivel: product.disponivel,
    atributos: product.atributos,
    mensagemWhatsapp: product.mensagem_whatsapp,
    categoria: product.categoria,
    imagens: images,
  };
}

export async function listPublicHomeSections(): Promise<PublicHomeSection[]> {
  /*
   * Primeiro carregamos somente as seções ativas.
   */
  const { data: sectionsData, error: sectionsError } = await supabase
    .from("secoes_home")
    .select(
      `
      id,
      titulo,
      subtitulo,
      slug,
      posicao,
      limite_produtos
    `,
    )
    .eq("ativa", true)
    .order("posicao", {
      ascending: true,
    });

  if (sectionsError) {
    console.error("Erro ao carregar seções públicas:", sectionsError);

    throw new PublicHomeError(
      "Não foi possível carregar as seções da página inicial.",
    );
  }

  const sections = sectionsData as HomeSectionDatabaseRow[];

  if (sections.length === 0) {
    return [];
  }

  const sectionIds = sections.map((section) => section.id);

  /*
   * Depois carregamos os relacionamentos com os produtos.
   *
   * O !inner e o filtro de status impedem que rascunhos e
   * produtos arquivados apareçam, inclusive quando um
   * administrador autenticado acessa a página pública.
   */
  const { data: sectionProductsData, error: sectionProductsError } =
    await supabase
      .from("home_secao_produtos")
      .select(
        `
      secao_id,
      posicao,
      produtos!home_secao_produtos_produto_id_fkey!inner (
        id,
        categoria_id,
        nome,
        slug,
        descricao_curta,
        descricao,
        disponivel,
        atributos,
        mensagem_whatsapp,
        status,
        categoria:categorias!produtos_categoria_id_fkey (
          id,
          nome,
          slug
        ),
        imagens:produto_imagens!produto_imagens_produto_id_fkey (
          id,
          storage_path,
          alt_text,
          posicao
        )
      )
    `,
      )
      .in("secao_id", sectionIds)
      .eq("produtos.status", "publicado")
      .order("posicao", {
        ascending: true,
      });

  if (sectionProductsError) {
    console.error(
      "Erro ao carregar produtos das seções públicas:",
      sectionProductsError,
    );

    throw new PublicHomeError(
      "Não foi possível carregar os produtos da página inicial.",
    );
  }

  const sectionProducts =
    sectionProductsData as unknown as HomeSectionProductDatabaseRow[];

  /*
   * Mesmo que o banco já devolva ordenado, organizamos
   * novamente para garantir a posição dentro de cada seção.
   */
  const sortedSectionProducts = [...sectionProducts].sort(
    (firstItem, secondItem) => firstItem.posicao - secondItem.posicao,
  );

  const productsBySection = new Map<string, PublicProduct[]>();

  for (const item of sortedSectionProducts) {
    if (!item.produtos) {
      continue;
    }

    const currentProducts = productsBySection.get(item.secao_id) ?? [];

    currentProducts.push(await mapPublicProduct(item.produtos));

    productsBySection.set(item.secao_id, currentProducts);
  }

  return (
    sections
      .map((section) => ({
        id: section.id,
        titulo: section.titulo,
        subtitulo: section.subtitulo,
        slug: section.slug,
        posicao: section.posicao,
        limiteProdutos: section.limite_produtos,

        produtos: (productsBySection.get(section.id) ?? []).slice(
          0,
          section.limite_produtos,
        ),
      }))
      /*
       * Uma seção ativa, mas sem produtos publicados,
       * não deve deixar um espaço vazio na Home.
       */
      .filter((section) => section.produtos.length > 0)
  );
}
