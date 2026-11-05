import { useEffect, useState, type FormEvent } from "react";
import type { Category } from "../../categories/types/category";
import { createSlug } from "../../../shared/utils/createSlug";
import {
  productFormSchema,
  type ProductFormValues,
} from "../schemas/productSchema";
import {
  PRODUCT_STATUS_VALUES,
  type Product,
  type ProductAttributeField,
  type ProductStatus,
} from "../types/product";
import {
  attributesRecordToFields,
  createEmptyProductAttribute,
} from "../utils/productAttributes";

type ProductFormProps = {
  product?: Product | null;
  categories: Category[];
  isSubmitting: boolean;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  onCancel: () => void;
};

type SimpleField =
  | "categoriaId"
  | "nome"
  | "slug"
  | "descricaoCurta"
  | "descricao"
  | "status"
  | "disponivel"
  | "mensagemWhatsapp";

type FieldErrors = Partial<Record<SimpleField, string>>;

type AttributeErrors = Record<
  number,
  {
    chave?: string;
    valor?: string;
  }
>;

function isProductStatus(value: string): value is ProductStatus {
  return PRODUCT_STATUS_VALUES.includes(value as ProductStatus);
}

function createInitialValues(
  product: Product | null | undefined,
  categories: Category[],
): ProductFormValues {
  const firstAvailableCategory =
    categories.find((category) => category.ativa) ?? categories[0];

  return {
    categoriaId: product?.categoria_id ?? firstAvailableCategory?.id ?? "",

    nome: product?.nome ?? "",
    slug: product?.slug ?? "",

    descricaoCurta: product?.descricao_curta ?? "",

    descricao: product?.descricao ?? "",

    status:
      product && isProductStatus(product.status) ? product.status : "rascunho",

    disponivel: product?.disponivel ?? true,

    atributos: product ? attributesRecordToFields(product.atributos) : [],

    mensagemWhatsapp: product?.mensagem_whatsapp ?? "",
  };
}

export function ProductForm({
  product,
  categories,
  isSubmitting,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>(() =>
    createInitialValues(product, categories),
  );

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [attributeErrors, setAttributeErrors] = useState<AttributeErrors>({});

  const [attributesGeneralError, setAttributesGeneralError] = useState<
    string | null
  >(null);

  const [slugWasEdited, setSlugWasEdited] = useState(Boolean(product));

  useEffect(() => {
    setValues(createInitialValues(product, categories));

    setSlugWasEdited(Boolean(product));
    setFieldErrors({});
    setAttributeErrors({});
    setAttributesGeneralError(null);
  }, [product, categories]);

  function handleNameChange(nextName: string) {
    setValues((currentValues) => ({
      ...currentValues,
      nome: nextName,
      slug: slugWasEdited ? currentValues.slug : createSlug(nextName),
    }));
  }

  function handleSlugChange(nextSlug: string) {
    setSlugWasEdited(true);

    setValues((currentValues) => ({
      ...currentValues,
      slug: createSlug(nextSlug),
    }));
  }

  function regenerateSlug() {
    setValues((currentValues) => ({
      ...currentValues,
      slug: createSlug(currentValues.nome),
    }));

    setSlugWasEdited(false);
  }

  function addAttribute() {
    setValues((currentValues) => ({
      ...currentValues,
      atributos: [...currentValues.atributos, createEmptyProductAttribute()],
    }));
  }

  function removeAttribute(attributeId: string) {
    setValues((currentValues) => ({
      ...currentValues,
      atributos: currentValues.atributos.filter(
        (attribute) => attribute.id !== attributeId,
      ),
    }));
  }

  function updateAttribute(
    attributeId: string,
    field: keyof Pick<ProductAttributeField, "chave" | "valor">,
    value: string,
  ) {
    setValues((currentValues) => ({
      ...currentValues,
      atributos: currentValues.atributos.map((attribute) =>
        attribute.id === attributeId
          ? {
              ...attribute,
              [field]: value,
            }
          : attribute,
      ),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationResult = productFormSchema.safeParse(values);

    if (!validationResult.success) {
      const nextFieldErrors: FieldErrors = {};
      const nextAttributeErrors: AttributeErrors = {};

      let nextAttributesGeneralError: string | null = null;

      for (const issue of validationResult.error.issues) {
        const [field, index, nestedField] = issue.path;

        if (field === "atributos") {
          if (
            typeof index === "number" &&
            (nestedField === "chave" || nestedField === "valor")
          ) {
            nextAttributeErrors[index] = {
              ...nextAttributeErrors[index],
              [nestedField]: issue.message,
            };
          } else {
            nextAttributesGeneralError = issue.message;
          }

          continue;
        }

        if (typeof field === "string") {
          nextFieldErrors[field as SimpleField] = issue.message;
        }
      }

      setFieldErrors(nextFieldErrors);
      setAttributeErrors(nextAttributeErrors);
      setAttributesGeneralError(nextAttributesGeneralError);

      return;
    }

    setFieldErrors({});
    setAttributeErrors({});
    setAttributesGeneralError(null);

    await onSubmit(validationResult.data);
  }

  const hasCategories = categories.length > 0;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {!hasCategories && (
        <div
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          Cadastre pelo menos uma categoria antes de cadastrar um produto.
        </div>
      )}

      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-stone-950">
          Informações principais
        </h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="product-category"
              className="mb-2 block text-sm font-medium text-stone-700"
            >
              Categoria
            </label>

            <select
              id="product-category"
              value={values.categoriaId}
              onChange={(event) =>
                setValues((currentValues) => ({
                  ...currentValues,
                  categoriaId: event.target.value,
                }))
              }
              disabled={isSubmitting || !hasCategories}
              className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 disabled:bg-stone-100"
            >
              <option value="">Selecione</option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nome}
                  {!category.ativa ? " — inativa" : ""}
                </option>
              ))}
            </select>

            {fieldErrors.categoriaId && (
              <p className="mt-2 text-sm text-red-700">
                {fieldErrors.categoriaId}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="product-name"
              className="mb-2 block text-sm font-medium text-stone-700"
            >
              Nome
            </label>

            <input
              id="product-name"
              value={values.nome}
              onChange={(event) => handleNameChange(event.target.value)}
              maxLength={150}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-stone-300 px-4 py-3 outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 disabled:bg-stone-100"
            />

            {fieldErrors.nome && (
              <p className="mt-2 text-sm text-red-700">{fieldErrors.nome}</p>
            )}
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between gap-4">
            <label
              htmlFor="product-slug"
              className="block text-sm font-medium text-stone-700"
            >
              Endereço do produto
            </label>

            <button
              type="button"
              onClick={regenerateSlug}
              disabled={isSubmitting || !values.nome}
              className="text-xs font-medium text-stone-600 hover:text-stone-950 disabled:opacity-50"
            >
              Gerar novamente
            </button>
          </div>

          <input
            id="product-slug"
            value={values.slug}
            onChange={(event) => handleSlugChange(event.target.value)}
            maxLength={180}
            disabled={isSubmitting}
            className="w-full rounded-lg border border-stone-300 px-4 py-3 outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 disabled:bg-stone-100"
          />

          <p className="mt-2 text-xs text-stone-500">
            /produto/{values.slug || "nome-do-produto"}
          </p>

          {fieldErrors.slug && (
            <p className="mt-2 text-sm text-red-700">{fieldErrors.slug}</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-stone-950">Descrição</h2>

        <div className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="product-short-description"
              className="mb-2 block text-sm font-medium text-stone-700"
            >
              Descrição curta
            </label>

            <textarea
              id="product-short-description"
              value={values.descricaoCurta}
              onChange={(event) =>
                setValues((currentValues) => ({
                  ...currentValues,
                  descricaoCurta: event.target.value,
                }))
              }
              rows={3}
              maxLength={300}
              disabled={isSubmitting}
              className="w-full resize-y rounded-lg border border-stone-300 px-4 py-3 outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 disabled:bg-stone-100"
            />

            <p className="mt-2 text-right text-xs text-stone-500">
              {values.descricaoCurta.length}/300
            </p>

            {fieldErrors.descricaoCurta && (
              <p className="mt-2 text-sm text-red-700">
                {fieldErrors.descricaoCurta}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="product-description"
              className="mb-2 block text-sm font-medium text-stone-700"
            >
              Descrição completa
            </label>

            <textarea
              id="product-description"
              value={values.descricao}
              onChange={(event) =>
                setValues((currentValues) => ({
                  ...currentValues,
                  descricao: event.target.value,
                }))
              }
              rows={7}
              maxLength={5000}
              disabled={isSubmitting}
              className="w-full resize-y rounded-lg border border-stone-300 px-4 py-3 outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 disabled:bg-stone-100"
            />

            <p className="mt-2 text-right text-xs text-stone-500">
              {values.descricao.length}/5000
            </p>

            {fieldErrors.descricao && (
              <p className="mt-2 text-sm text-red-700">
                {fieldErrors.descricao}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-stone-950">Publicação</h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="product-status"
              className="mb-2 block text-sm font-medium text-stone-700"
            >
              Status
            </label>

            <select
              id="product-status"
              value={values.status}
              onChange={(event) =>
                setValues((currentValues) => ({
                  ...currentValues,
                  status: event.target.value as ProductStatus,
                }))
              }
              disabled={isSubmitting}
              className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 disabled:bg-stone-100"
            >
              <option value="rascunho">Rascunho</option>

              <option value="publicado" disabled={!product}>Publicado</option>

              <option value="arquivado">Arquivado</option>
            </select>
            {!product && <p className="mt-2 text-xs text-stone-500">Salve o rascunho e envie uma imagem antes de publicar.</p>}
          </div>

          <label className="flex items-center gap-3 rounded-lg border border-stone-200 p-4">
            <input
              type="checkbox"
              checked={values.disponivel}
              onChange={(event) =>
                setValues((currentValues) => ({
                  ...currentValues,
                  disponivel: event.target.checked,
                }))
              }
              disabled={isSubmitting}
              className="size-4 rounded border-stone-300"
            />

            <span>
              <span className="block text-sm font-medium text-stone-900">
                Produto disponível
              </span>

              <span className="block text-xs text-stone-500">
                Produtos indisponíveis podem ser exibidos com essa indicação.
              </span>
            </span>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-stone-950">
              Características
            </h2>

            <p className="mt-1 text-sm text-stone-600">
              Adicione material, tamanho, aroma, largura, cores ou outras
              informações.
            </p>
          </div>

          <button
            type="button"
            onClick={addAttribute}
            disabled={isSubmitting || values.atributos.length >= 20}
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-50"
          >
            Adicionar
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {values.atributos.length === 0 && (
            <div className="rounded-lg border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
              Nenhuma característica adicionada.
            </div>
          )}

          {values.atributos.map((attribute, index) => (
            <div
              key={attribute.id}
              className="grid gap-3 rounded-lg border border-stone-200 p-4 md:grid-cols-[1fr_1fr_auto]"
            >
              <div>
                <input
                  value={attribute.chave}
                  onChange={(event) =>
                    updateAttribute(attribute.id, "chave", event.target.value)
                  }
                  maxLength={60}
                  disabled={isSubmitting}
                  placeholder="Ex.: Material"
                  aria-label={`Nome da característica ${index + 1}`}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10"
                />

                {attributeErrors[index]?.chave && (
                  <p className="mt-2 text-sm text-red-700">
                    {attributeErrors[index].chave}
                  </p>
                )}
              </div>

              <div>
                <input
                  value={attribute.valor}
                  onChange={(event) =>
                    updateAttribute(attribute.id, "valor", event.target.value)
                  }
                  maxLength={200}
                  disabled={isSubmitting}
                  placeholder="Ex.: Algodão"
                  aria-label={`Valor da característica ${index + 1}`}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10"
                />

                {attributeErrors[index]?.valor && (
                  <p className="mt-2 text-sm text-red-700">
                    {attributeErrors[index].valor}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeAttribute(attribute.id)}
                disabled={isSubmitting}
                className="self-start rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                Remover
              </button>
            </div>
          ))}

          {attributesGeneralError && (
            <p className="text-sm text-red-700">{attributesGeneralError}</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-stone-950">WhatsApp</h2>

        <p className="mt-1 text-sm text-stone-600">
          Mensagem personalizada enviada quando o cliente selecionar este
          produto.
        </p>

        <textarea
          value={values.mensagemWhatsapp}
          onChange={(event) =>
            setValues((currentValues) => ({
              ...currentValues,
              mensagemWhatsapp: event.target.value,
            }))
          }
          rows={4}
          maxLength={500}
          disabled={isSubmitting}
          className="mt-5 w-full resize-y rounded-lg border border-stone-300 px-4 py-3 outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 disabled:bg-stone-100"
          placeholder="Olá! Gostaria de saber mais sobre este produto."
        />

        <p className="mt-2 text-right text-xs text-stone-500">
          {values.mensagemWhatsapp.length}/500
        </p>

        {fieldErrors.mensagemWhatsapp && (
          <p className="mt-2 text-sm text-red-700">
            {fieldErrors.mensagemWhatsapp}
          </p>
        )}
      </section>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-lg border border-stone-300 px-5 py-3 text-sm font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-50"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={isSubmitting || !hasCategories}
          className="rounded-lg bg-stone-900 px-5 py-3 text-sm font-medium text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? "Salvando..."
            : product
              ? "Salvar alterações"
              : "Cadastrar produto"}
        </button>
      </div>
    </form>
  );
}
