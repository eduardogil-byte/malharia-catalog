import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { listCategoriesAdmin } from "../../features/categories/services/categoryService";
import type { Category } from "../../features/categories/types/category";
import { ProductForm } from "../../features/products/components/ProductForm";
import type { ProductFormValues } from "../../features/products/schemas/productSchema";
import {
  createProduct,
  getProductAdmin,
  updateProduct,
} from "../../features/products/services/productService";
import type { Product } from "../../features/products/types/product";
import { attributesFieldsToRecord } from "../../features/products/utils/productAttributes";
import { ProductImagesManager } from "../../features/products/components/ProductImagesManager";

export function ProductFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationNotice = typeof location.state?.notice === "string" ? location.state.notice : null;

  const { productId } = useParams<{
    productId: string;
  }>();

  const [product, setProduct] = useState<Product | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);

  const [saveError, setSaveError] = useState<string | null>(null);

  const isEditing = Boolean(productId);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const [categoriesData, productData] = await Promise.all([
          listCategoriesAdmin(),

          productId ? getProductAdmin(productId) : Promise.resolve(null),
        ]);

        if (cancelled) {
          return;
        }

        setCategories(categoriesData);
        setProduct(productData);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Erro ao carregar formulário de produto:", error);

        setLoadError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os dados.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  async function handleSubmit(values: ProductFormValues) {
    setIsSubmitting(true);
    setSaveError(null);

    const input = {
      categoriaId: values.categoriaId,
      nome: values.nome,
      slug: values.slug,

      descricaoCurta: values.descricaoCurta || null,

      descricao: values.descricao || null,

      status: values.status,
      disponivel: values.disponivel,

      atributos: attributesFieldsToRecord(values.atributos),

      mensagemWhatsapp: values.mensagemWhatsapp || null,
    };

    try {
      if (productId) {
        await updateProduct(productId, input);

        navigate("/admin/produtos", {
          replace: true,
          state: { notice: "Produto salvo com sucesso." },
        });

        return;
      }

      const createdProduct = await createProduct(input);

      navigate(`/admin/produtos/${createdProduct.id}/editar`, {
        replace: true,
        state: { notice: "Rascunho salvo. Adicione as fotos e depois publique o produto." },
      });
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o produto.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center text-stone-600">
        Carregando produto...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-sm text-red-800">{loadError}</p>

        <button
          type="button"
          onClick={() => navigate("/admin/produtos")}
          className="mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
        >
          Voltar aos produtos
        </button>
      </div>
    );
  }

  return (
    <section>
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
          Administração
        </p>

        <h1 className="mt-3 text-4xl font-semibold text-stone-950">
          {isEditing ? "Editar produto" : "Novo produto"}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
          {isEditing
            ? "Organize as fotos e os dados do produto. Para publicar, escolha o status no formulário abaixo."
            : "Comece pelos dados do produto. Depois de salvar o rascunho, você poderá adicionar as fotos e publicar."}
        </p>
      </header>

      {navigationNotice && <div role="status" className="mb-6 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">{navigationNotice}</div>}

      {saveError && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {saveError}
        </div>
      )}

      {product && (
        <div id="product-photos" className="mb-8">
          <ProductImagesManager productId={product.id} />
        </div>
      )}

      <div id="product-details">
        <ProductForm
          product={product}
          categories={categories}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/admin/produtos")}
        />
      </div>
    </section>
  );
}
