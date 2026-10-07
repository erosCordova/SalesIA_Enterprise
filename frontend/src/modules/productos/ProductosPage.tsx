import {
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  AlertTriangle,
  Boxes,
  Pencil,
  Plus,
  Search,
  Tags,
  Trash2,
} from "lucide-react";

import DataTable, {
  type DataTableColumn,
} from "../../components/ui/DataTable";

import ExportActions from "../../components/ui/ExportActions";
import Modal from "../../components/ui/Modal";
import ModuleState from "../../components/ui/ModuleState";
import Pagination from "../../components/ui/Pagination";

import {
  createProduct,
  deleteProduct,
  getCategories,
  getProducts,
  updateProduct,
} from "../../services/commercial.service";

import {
  useApiResource,
} from "../../hooks/useApiResource";

import {
  useAuth,
} from "../../services/auth.context";

import {
  createVisualPdfFile,
  downloadVisualPdf,
  exportDateStamp,
  exportRowsToCsv,
  exportRowsToExcel,
  shareFile,
  type ExportRow,
} from "../../utils/exporting";

import type {
  Product,
  ProductCreate,
  ProductUpdate,
} from "../../types/commercial";

import "./productos-commercial.css";


const PAGE_SIZE = 8;


const initialForm: ProductCreate = {
  category_id: null,
  sku: "",
  name: "",
  description: "",
  unit: "unidad",
  sale_price: 0,
  cost_price: 0,
  initial_stock: 0,
  minimum_stock: 0,
  maximum_stock: null,
  status: "active",
};


function normalize(
  value:
    | string
    | null
    | undefined,
) {
  return (
    value
      ?.normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        "",
      )
      .trim()
      .toLowerCase()
    ?? ""
  );
}


function toNumber(
  value:
    | number
    | string
    | null
    | undefined,
) {
  const parsed =
    Number(value);

  return Number.isFinite(
    parsed,
  )
    ? parsed
    : 0;
}


function formatMoney(
  value:
    | number
    | string
    | null
    | undefined,
) {
  return new Intl.NumberFormat(
    "es-PE",
    {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(
    toNumber(value),
  );
}


function statusLabel(
  status: string,
) {
  return status === "active"
    ? "Activo"
    : "Inactivo";
}


function exportRows(
  products: Product[],
): ExportRow[] {
  return products.map(
    (product) => ({
      SKU:
        product.sku,

      Producto:
        product.name,

      Descripción:
        product.description
        ?? "",

      Categoría:
        product.category_name
        ?? "Sin categoría",

      Unidad:
        product.unit,

      "Precio de venta":
        toNumber(
          product.sale_price,
        ),

      "Precio de costo":
        toNumber(
          product.cost_price,
        ),

      Stock:
        toNumber(
          product.stock_quantity,
        ),

      "Stock mínimo":
        toNumber(
          product.minimum_stock,
        ),

      "Stock máximo":
        product.maximum_stock ===
          null
        || product.maximum_stock ===
          undefined
          ? ""
          : toNumber(
              product.maximum_stock,
            ),

      Estado:
        statusLabel(
          product.status,
        ),
    }),
  );
}


export default function ProductosPage() {
  const exportRef =
    useRef<HTMLElement>(
      null,
    );


  const {
    user,
  } =
    useAuth();


  const productsResource =
    useApiResource(
      getProducts,
    );


  const categoriesResource =
    useApiResource(
      getCategories,
    );


  const [
    search,
    setSearch,
  ] =
    useState("");


  const [
    categoryFilter,
    setCategoryFilter,
  ] =
    useState("");


  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState("");


  const [
    page,
    setPage,
  ] =
    useState(1);


  const [
    modalOpen,
    setModalOpen,
  ] =
    useState(false);


  const [
    editingProduct,
    setEditingProduct,
  ] =
    useState<Product | null>(
      null,
    );


  const [
    form,
    setForm,
  ] =
    useState<ProductCreate>(
      initialForm,
    );


  const [
    saving,
    setSaving,
  ] =
    useState(false);


  const [
    formError,
    setFormError,
  ] =
    useState("");


  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState("");


  const [
    operationError,
    setOperationError,
  ] =
    useState("");


  const products =
    productsResource.data
    ?? [];


  const categories =
    categoriesResource.data
    ?? [];


  const canManageProduct =
    user?.role === "Administrador"
    || user?.role === "Gerente"
    || user?.role === "Almacén";


  const filteredProducts =
    useMemo(
      () => {
        const query =
          normalize(
            search,
          );

        return products.filter(
          (product) => {
            const matchesSearch =
              !query
              || [
                product.sku,
                product.name,
                product.description,
                product.category_name,
                product.unit,
              ].some(
                (value) =>
                  normalize(
                    String(
                      value
                      ?? "",
                    ),
                  ).includes(
                    query,
                  ),
              );


            const matchesCategory =
              !categoryFilter
              || product.category_id ===
                categoryFilter;


            const matchesStatus =
              !statusFilter
              || product.status ===
                statusFilter;


            return (
              matchesSearch
              && matchesCategory
              && matchesStatus
            );
          },
        );
      },
      [
        products,
        search,
        categoryFilter,
        statusFilter,
      ],
    );


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredProducts.length
        / PAGE_SIZE,
      ),
    );


  const safePage =
    Math.min(
      page,
      totalPages,
    );


  const paginatedProducts =
    useMemo(
      () => {
        const start =
          (
            safePage - 1
          )
          * PAGE_SIZE;

        return filteredProducts.slice(
          start,
          start + PAGE_SIZE,
        );
      },
      [
        filteredProducts,
        safePage,
      ],
    );


  const columns:
    DataTableColumn<Product>[] = [
      {
        key: "sku",

        label: "SKU",

        render: (product) => (
          <strong className="product-sku">
            {product.sku}
          </strong>
        ),
      },

      {
        key: "product",

        label: "Producto",

        render: (product) => (
          <div className="product-cell">
            <div className="product-avatar">
              <Boxes
                size={16}
              />
            </div>

            <div>
              <strong>
                {product.name}
              </strong>

              <span>
                {product.description
                  || "Sin descripción"}
              </span>
            </div>
          </div>
        ),
      },

      {
        key: "category",

        label: "Categoría",

        render: (product) => (
          <span className="product-detail">
            <Tags
              size={13}
            />

            {product.category_name
              || "Sin categoría"}
          </span>
        ),
      },

      {
        key: "unit",

        label: "Unidad",

        render: (product) => (
          <span>
            {product.unit}
          </span>
        ),
      },

      {
        key: "sale_price",

        label: "Precio venta",

        render: (product) => (
          <strong className="product-price">
            {formatMoney(
              product.sale_price,
            )}
          </strong>
        ),
      },

      {
        key: "cost_price",

        label: "Costo",

        render: (product) => (
          <span>
            {formatMoney(
              product.cost_price,
            )}
          </span>
        ),
      },

      {
        key: "stock",

        label: "Stock",

        render: (product) => {
          const stock =
            toNumber(
              product.stock_quantity,
            );

          const minimum =
            toNumber(
              product.minimum_stock,
            );

          const lowStock =
            stock <= minimum;

          return (
            <span
              className={`product-stock ${
                lowStock
                  ? "is-low"
                  : ""
              }`}
              title={`Stock mínimo: ${minimum}`}
            >
              {lowStock
                ? (
                  <AlertTriangle
                    size={13}
                  />
                )
                : (
                  <Boxes
                    size={13}
                  />
                )}

              {stock}
            </span>
          );
        },
      },

      {
        key: "minimum_stock",

        label: "Mínimo",

        render: (product) => (
          <span>
            {toNumber(
              product.minimum_stock,
            )}
          </span>
        ),
      },

      {
        key: "status",

        label: "Estado",

        render: (product) => (
          <span
            className={`status-badge ${
              product.status ===
                "active"
                ? "success"
                : "inactive"
            }`}
          >
            {statusLabel(
              product.status,
            )}
          </span>
        ),
      },
    ];


  function resetForm() {
    setForm(
      initialForm,
    );

    setEditingProduct(
      null,
    );

    setFormError(
      "",
    );
  }


  function openCreate() {
    resetForm();

    setSuccessMessage(
      "",
    );

    setOperationError(
      "",
    );

    setModalOpen(
      true,
    );
  }


  function openEdit(
    product: Product,
  ) {
    setEditingProduct(
      product,
    );

    setForm({
      category_id:
        product.category_id
        ?? null,

      sku:
        product.sku,

      name:
        product.name,

      description:
        product.description
        ?? "",

      unit:
        product.unit,

      sale_price:
        toNumber(
          product.sale_price,
        ),

      cost_price:
        toNumber(
          product.cost_price,
        ),

      initial_stock:
        toNumber(
          product.stock_quantity,
        ),

      minimum_stock:
        toNumber(
          product.minimum_stock,
        ),

      maximum_stock:
        product.maximum_stock ===
          null
        || product.maximum_stock ===
          undefined
          ? null
          : toNumber(
              product.maximum_stock,
            ),

      status:
        product.status ===
          "active"
          ? "active"
          : "inactive",
    });

    setFormError(
      "",
    );

    setSuccessMessage(
      "",
    );

    setOperationError(
      "",
    );

    setModalOpen(
      true,
    );
  }


  function validateForm() {
    const maximumStock =
      form.maximum_stock;


    if (
      maximumStock !== null
      && maximumStock !== undefined
      && toNumber(
        maximumStock,
      ) <
        toNumber(
          form.minimum_stock,
        )
    ) {
      setFormError(
        "El stock máximo no puede ser menor al stock mínimo.",
      );

      return false;
    }


    return true;
  }


  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setFormError(
      "",
    );

    setSuccessMessage(
      "",
    );

    setOperationError(
      "",
    );


    if (
      !validateForm()
    ) {
      return;
    }


    setSaving(
      true,
    );


    try {
      if (
        editingProduct
      ) {
        const payload:
          ProductUpdate = {
            category_id:
              form.category_id
              || null,

            sku:
              form.sku.trim(),

            name:
              form.name.trim(),

            description:
              form.description
                ?.trim()
              || null,

            unit:
              form.unit.trim(),

            sale_price:
              Number(
                form.sale_price,
              ),

            cost_price:
              Number(
                form.cost_price,
              ),

            minimum_stock:
              Number(
                form.minimum_stock,
              ),

            maximum_stock:
              form.maximum_stock ===
                null
              || form.maximum_stock ===
                undefined
                ? null
                : Number(
                    form.maximum_stock,
                  ),

            status:
              form.status
              ?? "active",
          };


        await updateProduct(
          editingProduct.id,
          payload,
        );


        setSuccessMessage(
          "Producto actualizado correctamente.",
        );
      } else {
        await createProduct({
          ...form,

          category_id:
            form.category_id
            || null,

          sku:
            form.sku.trim(),

          name:
            form.name.trim(),

          description:
            form.description
              ?.trim()
            || null,

          unit:
            form.unit.trim(),

          sale_price:
            Number(
              form.sale_price,
            ),

          cost_price:
            Number(
              form.cost_price,
            ),

          initial_stock:
            Number(
              form.initial_stock,
            ),

          minimum_stock:
            Number(
              form.minimum_stock,
            ),

          maximum_stock:
            form.maximum_stock ===
              null
            || form.maximum_stock ===
              undefined
              ? null
              : Number(
                  form.maximum_stock,
                ),

          status:
            form.status
            ?? "active",
        });


        setSuccessMessage(
          "Producto registrado correctamente.",
        );
      }


      setModalOpen(
        false,
      );

      resetForm();

      setPage(
        1,
      );

      await productsResource.reload();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : editingProduct
            ? "No se pudo actualizar el producto."
            : "No se pudo registrar el producto.",
      );
    } finally {
      setSaving(
        false,
      );
    }
  }


  async function handleDeactivate(
    product: Product,
  ) {
    if (
      product.status !==
      "active"
    ) {
      return;
    }


    const confirmed =
      window.confirm(
        `¿Deseas desactivar el producto "${product.name}"?`,
      );


    if (
      !confirmed
    ) {
      return;
    }


    setSaving(
      true,
    );

    setSuccessMessage(
      "",
    );

    setOperationError(
      "",
    );


    try {
      await deleteProduct(
        product.id,
      );

      await productsResource.reload();

      setSuccessMessage(
        "Producto desactivado correctamente.",
      );
    } catch (error) {
      setOperationError(
        error instanceof Error
          ? error.message
          : "No se pudo desactivar el producto.",
      );
    } finally {
      setSaving(
        false,
      );
    }
  }


  function exportFilename() {
    return `productos-${exportDateStamp()}`;
  }


  async function handlePdf() {
    if (
      !exportRef.current
    ) {
      return;
    }


    setOperationError(
      "",
    );


    try {
      await downloadVisualPdf(
        exportRef.current,
        exportFilename(),
      );
    } catch (error) {
      setOperationError(
        error instanceof Error
          ? error.message
          : "No se pudo generar el PDF.",
      );
    }
  }


  function handleCsv() {
    setOperationError(
      "",
    );


    try {
      exportRowsToCsv(
        exportFilename(),
        exportRows(
          filteredProducts,
        ),
      );
    } catch (error) {
      setOperationError(
        error instanceof Error
          ? error.message
          : "No se pudo generar el CSV.",
      );
    }
  }


  async function handleExcel() {
    setOperationError(
      "",
    );


    try {
      await exportRowsToExcel(
        exportFilename(),
        "Productos",
        exportRows(
          filteredProducts,
        ),
      );
    } catch (error) {
      setOperationError(
        error instanceof Error
          ? error.message
          : "No se pudo generar el archivo Excel.",
      );
    }
  }


  async function handleShare() {
    if (
      !exportRef.current
    ) {
      return;
    }


    setOperationError(
      "",
    );


    try {
      const file =
        await createVisualPdfFile(
          exportRef.current,
          exportFilename(),
        );


      const result =
        await shareFile(
          file,
          "Productos - SalesIA Enterprise",
          "Catálogo de productos de SalesIA Enterprise.",
        );


      if (
        result ===
        "downloaded"
      ) {
        setSuccessMessage(
          "El navegador no permite compartir el archivo directamente. El PDF fue descargado para que puedas enviarlo manualmente.",
        );
      }
    } catch (error) {
      setOperationError(
        error instanceof Error
          ? error.message
          : "No se pudo compartir el archivo.",
      );
    }
  }


  const loading =
    productsResource.loading
    || categoriesResource.loading;


  const loadError =
    productsResource.error
    || categoriesResource.error;


  return (
    <section
      ref={exportRef}
      className="products-page"
    >
      <div className="products-title">
        <div>
          <span>
            Catálogo comercial
          </span>

          <h2>
            Productos
          </h2>

          <p>
            {filteredProducts.length}{" "}
            {filteredProducts.length ===
              1
              ? "producto"
              : "productos"}
            {" "}
            en la vista actual
          </p>
        </div>
      </div>


      {successMessage && (
        <ModuleState
          type="success"
          title="Operación completada"
          description={
            successMessage
          }
        />
      )}


      {operationError && (
        <ModuleState
          type="error"
          title="No se pudo completar la operación"
          description={
            operationError
          }
        />
      )}


      <div
        className="products-toolbar"
        data-export-hide="true"
      >
        <div className="products-filters">
          <label className="products-search">
            <Search
              size={15}
            />

            <input
              type="search"
              value={
                search
              }
              onChange={(
                event,
              ) => {
                setSearch(
                  event.target.value,
                );

                setPage(
                  1,
                );
              }}
              placeholder="Buscar producto..."
            />
          </label>


          <select
            value={
              categoryFilter
            }
            onChange={(
              event,
            ) => {
              setCategoryFilter(
                event.target.value,
              );

              setPage(
                1,
              );
            }}
          >
            <option value="">
              Todas las categorías
            </option>

            {categories.map(
              (category) => (
                <option
                  key={
                    category.id
                  }
                  value={
                    category.id
                  }
                >
                  {category.name}
                </option>
              ),
            )}
          </select>


          <select
            value={
              statusFilter
            }
            onChange={(
              event,
            ) => {
              setStatusFilter(
                event.target.value,
              );

              setPage(
                1,
              );
            }}
          >
            <option value="">
              Todos los estados
            </option>

            <option value="active">
              Activos
            </option>

            <option value="inactive">
              Inactivos
            </option>
          </select>
        </div>


        <div className="products-toolbar-actions">
          <ExportActions
            disabled={
              loading
              || filteredProducts.length ===
                0
            }
            onPdf={
              handlePdf
            }
            onCsv={
              handleCsv
            }
            onExcel={
              handleExcel
            }
            onShare={
              handleShare
            }
          />


          {canManageProduct && (
            <button
              type="button"
              className="primary-button products-new-button"
              onClick={
                openCreate
              }
            >
              <Plus
                size={15}
              />

              Nuevo producto
            </button>
          )}
        </div>
      </div>


      <article className="products-table-panel">
        {loading ? (
          <ModuleState
            type="loading"
            title="Cargando productos"
            description="Consultando productos y categorías."
          />
        ) : loadError ? (
          <div>
            <ModuleState
              type="error"
              title="No se pudo cargar el catálogo"
              description={
                loadError
              }
            />

            <div
              className="products-retry"
              data-export-hide="true"
            >
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  void Promise.all([
                    productsResource.reload(),
                    categoriesResource.reload(),
                  ]);
                }}
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : filteredProducts.length ===
          0 ? (
          <ModuleState
            type="empty"
            title={
              search
              || categoryFilter
              || statusFilter
                ? "No encontramos productos"
                : "Todavía no hay productos"
            }
            description={
              search
              || categoryFilter
              || statusFilter
                ? "No existen productos que coincidan con los filtros."
                : "No existen productos registrados."
            }
          />
        ) : (
          <>
            <DataTable
              columns={
                columns
              }
              data={
                paginatedProducts
              }
              getRowKey={(
                product,
              ) =>
                product.id
              }
              actions={
                canManageProduct
                  ? (
                    product,
                  ) => (
                    <div className="table-actions">
                      <button
                        type="button"
                        className="icon-button"
                        title="Editar producto"
                        disabled={
                          saving
                        }
                        onClick={() =>
                          openEdit(
                            product,
                          )
                        }
                      >
                        <Pencil
                          size={15}
                        />
                      </button>


                      <button
                        type="button"
                        className="icon-button"
                        title="Desactivar producto"
                        disabled={
                          saving
                          || product.status !==
                            "active"
                        }
                        onClick={() =>
                          void handleDeactivate(
                            product,
                          )
                        }
                      >
                        <Trash2
                          size={15}
                        />
                      </button>
                    </div>
                  )
                  : undefined
              }
            />


            <Pagination
              page={
                safePage
              }
              totalPages={
                totalPages
              }
              onPageChange={
                setPage
              }
            />
          </>
        )}
      </article>


      <Modal
        open={
          modalOpen
        }
        title={
          editingProduct
            ? "Editar producto"
            : "Registrar producto"
        }
        description={
          editingProduct
            ? "Actualiza los datos comerciales del producto."
            : "Registra un nuevo producto y su inventario inicial."
        }
        onClose={() => {
          if (
            !saving
          ) {
            setModalOpen(
              false,
            );

            resetForm();
          }
        }}
      >
        <form
          className="enterprise-form"
          onSubmit={
            handleSubmit
          }
        >
          {formError && (
            <ModuleState
              type="error"
              title={
                editingProduct
                  ? "No se pudo actualizar"
                  : "No se pudo registrar"
              }
              description={
                formError
              }
            />
          )}


          <div className="form-grid">
            <label>
              <span>
                SKU
              </span>

              <input
                type="text"
                minLength={2}
                maxLength={100}
                value={
                  form.sku
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    sku:
                      event.target.value,
                  })
                }
                placeholder="Ej. PROD-001"
                required
              />
            </label>


            <label>
              <span>
                Categoría
              </span>

              <select
                value={
                  form.category_id
                  ?? ""
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    category_id:
                      event.target.value
                      || null,
                  })
                }
              >
                <option value="">
                  Sin categoría
                </option>

                {categories
                  .filter(
                    (category) =>
                      category.status ===
                        "active"
                      || category.id ===
                        form.category_id,
                  )
                  .map(
                    (category) => (
                      <option
                        key={
                          category.id
                        }
                        value={
                          category.id
                        }
                      >
                        {category.name}
                      </option>
                    ),
                  )}
              </select>
            </label>


            <label className="form-full">
              <span>
                Nombre del producto
              </span>

              <input
                type="text"
                minLength={2}
                maxLength={200}
                value={
                  form.name
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    name:
                      event.target.value,
                  })
                }
                placeholder="Ej. Laptop empresarial"
                required
              />
            </label>


            <label className="form-full">
              <span>
                Descripción
              </span>

              <textarea
                maxLength={1000}
                value={
                  form.description
                  ?? ""
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    description:
                      event.target.value,
                  })
                }
                placeholder="Descripción comercial del producto"
              />
            </label>


            <label>
              <span>
                Unidad
              </span>

              <input
                type="text"
                minLength={1}
                maxLength={50}
                value={
                  form.unit
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    unit:
                      event.target.value,
                  })
                }
                placeholder="unidad"
                required
              />
            </label>


            <label>
              <span>
                Estado
              </span>

              <select
                value={
                  form.status
                  ?? "active"
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    status:
                      event.target.value ===
                        "active"
                        ? "active"
                        : "inactive",
                  })
                }
              >
                <option value="active">
                  Activo
                </option>

                <option value="inactive">
                  Inactivo
                </option>
              </select>
            </label>


            <label>
              <span>
                Precio de venta
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  form.sale_price
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    sale_price:
                      Number(
                        event.target.value,
                      ),
                  })
                }
                required
              />
            </label>


            <label>
              <span>
                Precio de costo
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  form.cost_price
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    cost_price:
                      Number(
                        event.target.value,
                      ),
                  })
                }
                required
              />
            </label>


            {!editingProduct && (
              <label>
                <span>
                  Stock inicial
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.initial_stock
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm({
                      ...form,
                      initial_stock:
                        Number(
                          event.target.value,
                        ),
                    })
                  }
                  required
                />
              </label>
            )}


            <label>
              <span>
                Stock mínimo
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  form.minimum_stock
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    minimum_stock:
                      Number(
                        event.target.value,
                      ),
                  })
                }
                required
              />
            </label>


            <label>
              <span>
                Stock máximo
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  form.maximum_stock
                  ?? ""
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    maximum_stock:
                      event.target.value ===
                        ""
                        ? null
                        : Number(
                            event.target.value,
                          ),
                  })
                }
                placeholder="Opcional"
              />
            </label>
          </div>


          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={
                saving
              }
              onClick={() => {
                setModalOpen(
                  false,
                );

                resetForm();
              }}
            >
              Cancelar
            </button>


            <button
              type="submit"
              className="primary-button"
              disabled={
                saving
              }
            >
              {saving
                ? "Guardando..."
                : editingProduct
                  ? "Actualizar producto"
                  : "Guardar producto"}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
