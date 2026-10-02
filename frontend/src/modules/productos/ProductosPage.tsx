import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  PackageSearch,
  Tags,
} from "lucide-react";

import DataTable, {
  type DataTableColumn,
} from "../../components/ui/DataTable";

import Modal from "../../components/ui/Modal";
import ModuleState from "../../components/ui/ModuleState";
import Pagination from "../../components/ui/Pagination";
import StatCard from "../../components/ui/StatCard";
import TableToolbar from "../../components/ui/TableToolbar";

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

import type {
  Product,
  ProductCreate,
} from "../../types/commercial";


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


function toNumber(
  value: number | string,
) {
  const parsed =
    Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}


function formatMoney(
  value: number | string,
) {
  return new Intl.NumberFormat(
    "es-PE",
    {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
    },
  ).format(
    toNumber(value),
  );
}


function ProductosPage() {
  const {
    user,
  } = useAuth();


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
  ] = useState("");


  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("");


  const [
    statusFilter,
    setStatusFilter,
  ] = useState("");


  const [
    page,
    setPage,
  ] = useState(1);


  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);


  const [
    form,
    setForm,
  ] = useState<ProductCreate>(
    initialForm,
  );


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    formError,
    setFormError,
  ] = useState("");


  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");


  const [
    editingProduct,
    setEditingProduct,
  ] = useState<Product | null>(null);


  const [
    editModalOpen,
    setEditModalOpen,
  ] = useState(false);


  const products =
    productsResource.data ??
    [];


  const categories =
    categoriesResource.data ??
    [];


  const canCreateProduct =
    user?.role ===
      "Administrador" ||
    user?.role ===
      "Gerente" ||
    user?.role ===
      "Almacén";


  const filteredProducts =
    useMemo(
      () => {
        const query =
          search
            .toLowerCase()
            .trim();

        return products.filter(
          (product) => {
            const matchesSearch =
              !query ||
              [
                product.sku,
                product.name,
                product.description,
                product.category_name,
                product.unit,
                product.status,
              ].some(
                (value) =>
                  String(value ?? "")
                    .toLowerCase()
                    .includes(query),
              );

            const matchesCategory =
              !categoryFilter ||
              product.category_id ===
                categoryFilter;

            const matchesStatus =
              !statusFilter ||
              product.status ===
                statusFilter;

            return (
              matchesSearch &&
              matchesCategory &&
              matchesStatus
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
        filteredProducts.length /
          PAGE_SIZE,
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
          (safePage - 1) *
          PAGE_SIZE;

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


  const activeProducts =
    products.filter(
      (product) =>
        product.status === "active",
    ).length;


  const lowStockProducts =
    products.filter(
      (product) =>
        toNumber(
          product.stock_quantity,
        ) <=
        toNumber(
          product.minimum_stock,
        ),
    ).length;


  const productsWithCategory =
    products.filter(
      (product) =>
        Boolean(
          product.category_id,
        ),
    ).length;


  const activePercentage =
    products.length > 0
      ? Math.round(
          (
            activeProducts /
            products.length
          ) * 100,
        )
      : 0;


  const categoryPercentage =
    products.length > 0
      ? Math.round(
          (
            productsWithCategory /
            products.length
          ) * 100,
        )
      : 0;


  const columns:
    DataTableColumn<Product>[] = [
      {
        key: "sku",
        label: "SKU",
        render: (product) => (
          <span className="table-detail">
            {product.sku}
          </span>
        ),
      },

      {
        key: "product",
        label: "Producto",
        render: (product) => (
          <div className="customer-cell">
            <div className="customer-avatar">
              <PackageSearch
                size={17}
              />
            </div>

            <div>
              <strong>
                {product.name}
              </strong>

              <span>
                {product.description ||
                  "Sin descripción"}
              </span>
            </div>
          </div>
        ),
      },

      {
        key: "category",
        label: "Categoría",
        render: (product) => (
          <span className="table-detail">
            <Tags size={13} />

            {product.category_name ||
              "Sin categoría"}
          </span>
        ),
      },

      {
        key: "unit",
        label: "Unidad",
        render: (product) => (
          <span className="table-detail">
            {product.unit}
          </span>
        ),
      },

      {
        key: "sale_price",
        label: "Precio venta",
        render: (product) => (
          <span className="table-detail">
            <CircleDollarSign
              size={13}
            />

            {formatMoney(
              product.sale_price,
            )}
          </span>
        ),
      },

      {
        key: "cost_price",
        label: "Costo",
        render: (product) => (
          <span className="table-detail">
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
              className="table-detail"
              title={`Stock mínimo: ${minimum}`}
            >
              {lowStock ? (
                <AlertTriangle
                  size={13}
                />
              ) : (
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
        label: "Stock mínimo",
        render: (product) => (
          <span className="table-detail">
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
            {product.status ===
            "active"
              ? "Activo"
              : "Inactivo"}
          </span>
        ),
      },

      {
        key: "actions",
        label: "Acciones",
        render: (product) => (
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                handleEditProduct(
                  product,
                )
              }
              disabled={saving}
            >
              Editar
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                void handleDeactivateProduct(
                  product,
                );
              }}
              disabled={
                saving ||
                product.status ===
                  "inactive"
              }
            >
              Desactivar
            </button>
          </div>
        ),
      },
    ];


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");


    if (
      form.maximum_stock !==
        null &&
      form.maximum_stock !==
        undefined &&
      form.maximum_stock <
        form.minimum_stock
    ) {
      setFormError(
        "El stock máximo no puede ser menor al stock mínimo.",
      );

      return;
    }


    setSaving(true);

    try {
      await createProduct({
        ...form,

        category_id:
          form.category_id ||
          null,

        sku:
          form.sku.trim(),

        name:
          form.name.trim(),

        description:
          form.description?.trim() ||
          null,

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
            null ||
          form.maximum_stock ===
            undefined
            ? null
            : Number(
                form.maximum_stock,
              ),

        status:
          form.status ??
          "active",
      });

      setForm(initialForm);
      setModalOpen(false);
      setPage(1);

      await productsResource.reload();

      setSuccessMessage(
        "Producto registrado correctamente.",
      );
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "No se pudo registrar el producto.",
      );
    } finally {
      setSaving(false);
    }
  }


  const handleEditProduct = (
    product: Product,
  ) => {
    setEditingProduct(product);

    setForm({
      category_id:
        product.category_id ??
        null,

      sku:
        product.sku,

      name:
        product.name,

      description:
        product.description ??
        "",

      unit:
        product.unit,

      sale_price:
        Number(
          product.sale_price,
        ),

      cost_price:
        Number(
          product.cost_price,
        ),

      initial_stock:
        Number(
          product.stock_quantity,
        ),

      minimum_stock:
        Number(
          product.minimum_stock,
        ),

      maximum_stock:
        product.maximum_stock ===
          null ||
        product.maximum_stock ===
          undefined
          ? null
          : Number(
              product.maximum_stock,
            ),

      status:
        product.status as
          | "active"
          | "inactive",
    });

    setFormError("");
    setEditModalOpen(true);
  };


  const handleUpdateProduct =
    async (
      event: FormEvent,
    ) => {
      event.preventDefault();

      if (!editingProduct) {
        return;
      }

      if (
        form.maximum_stock !==
          null &&
        form.maximum_stock !==
          undefined &&
        form.maximum_stock <
          form.minimum_stock
      ) {
        setFormError(
          "El stock máximo no puede ser menor al stock mínimo.",
        );

        return;
      }

      try {
        setSaving(true);
        setFormError("");

        await updateProduct(
          editingProduct.id,
          {
            category_id:
              form.category_id ||
              null,

            sku:
              form.sku.trim(),

            name:
              form.name.trim(),

            description:
              form.description?.trim() ||
              null,

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
                null ||
              form.maximum_stock ===
                undefined
                ? null
                : Number(
                    form.maximum_stock,
                  ),

            status:
              form.status ??
              "active",
          },
        );

        setEditModalOpen(false);
        setEditingProduct(null);
        setForm(initialForm);

        await productsResource.reload();

        setSuccessMessage(
          "Producto actualizado correctamente.",
        );
      } catch (error) {
        setFormError(
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el producto.",
        );
      } finally {
        setSaving(false);
      }
    };


  const handleDeactivateProduct =
    async (
      product: Product,
    ) => {
      try {
        setSaving(true);
        setFormError("");

        await deleteProduct(
          product.id,
        );

        await productsResource.reload();

        setSuccessMessage(
          "Producto desactivado correctamente.",
        );
      } catch (error) {
        setFormError(
          error instanceof Error
            ? error.message
            : "No se pudo desactivar el producto.",
        );
      } finally {
        setSaving(false);
      }
    };


  const loading =
    productsResource.loading ||
    categoriesResource.loading;


  const loadError =
    productsResource.error ||
    categoriesResource.error;


  return (
    <section className="module-page">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">
            CATÁLOGO COMERCIAL
          </span>

          <h1>
            Productos
          </h1>

          <p>
            Administra el catálogo real
            de productos, precios,
            categorías y niveles de
            stock de SalesIA Enterprise.
          </p>
        </div>

        <div className="module-main-icon">
          <PackageSearch
            size={27}
          />
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


      <div className="stats-grid">
        <StatCard
          title="Productos registrados"
          value={String(
            products.length,
          )}
          change="100%"
          caption="catálogo actual"
          icon={PackageSearch}
        />

        <StatCard
          title="Productos activos"
          value={String(
            activeProducts,
          )}
          change={`${activePercentage}%`}
          caption="disponibles"
          icon={CheckCircle2}
        />

        <StatCard
          title="Stock bajo"
          value={String(
            lowStockProducts,
          )}
          change={
            products.length > 0
              ? `${Math.round(
                  (
                    lowStockProducts /
                    products.length
                  ) * 100,
                )}%`
              : "0%"
          }
          positive={
            lowStockProducts === 0
          }
          caption="en mínimo o menos"
          icon={AlertTriangle}
        />

        <StatCard
          title="Con categoría"
          value={String(
            productsWithCategory,
          )}
          change={`${categoryPercentage}%`}
          caption="productos clasificados"
          icon={Tags}
        />
      </div>


      <article className="panel enterprise-data-panel">
        <TableToolbar
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          createLabel="Nuevo producto"
          canCreate={
            canCreateProduct
          }
          onCreate={() => {
            setForm(initialForm);
            setEditingProduct(null);
            setFormError("");
            setModalOpen(true);
          }}
        />


        <div
          style={{
            display: "flex",
            gap: "12px",
            padding: "0 20px 20px",
            flexWrap: "wrap",
          }}
        >
          <select
            value={categoryFilter}
            onChange={(event) => {
              setCategoryFilter(
                event.target.value,
              );
              setPage(1);
            }}
          >
            <option value="">
              Todas las categorías
            </option>

            {categories.map(
              (category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ),
            )}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(
                event.target.value,
              );
              setPage(1);
            }}
          >
            <option value="">
              Todos los estados
            </option>

            <option value="active">
              Activo
            </option>

            <option value="inactive">
              Inactivo
            </option>
          </select>
        </div>


        {loading ? (
          <ModuleState
            type="loading"
            title="Cargando productos"
            description="Consultando productos y categorías registrados en PostgreSQL."
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
              className="modal-actions"
              style={{
                padding:
                  "0 20px 20px",
              }}
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
              search ||
              categoryFilter ||
              statusFilter
                ? "No encontramos productos"
                : "Todavía no hay productos"
            }
            description={
              search ||
              categoryFilter ||
              statusFilter
                ? "Prueba con otros filtros."
                : canCreateProduct
                  ? "Registra el primer producto desde el botón Nuevo producto."
                  : "Todavía no existen productos registrados."
            }
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={
                paginatedProducts
              }
              getRowKey={(
                product,
              ) => product.id}
            />

            <Pagination
              page={safePage}
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
        open={modalOpen}
        title="Registrar nuevo producto"
        description="El producto y su inventario inicial serán registrados mediante la API."
        onClose={() => {
          if (!saving) {
            setModalOpen(false);
            setFormError("");
            setForm(initialForm);
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
              title="No se pudo registrar"
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
                      event.target
                        .value,
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
                  form.category_id ??
                  ""
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    category_id:
                      event.target
                        .value ||
                      null,
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
                      "active",
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
                      event.target
                        .value,
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
                  form.description ??
                  ""
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    description:
                      event.target
                        .value,
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
                      event.target
                        .value,
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
                  form.status ??
                  "active"
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    status:
                      event.target
                        .value as
                        | "active"
                        | "inactive",
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
                        event.target
                          .value,
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
                        event.target
                          .value,
                      ),
                  })
                }
                required
              />
            </label>


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
                        event.target
                          .value,
                      ),
                  })
                }
                required
              />
            </label>


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
                        event.target
                          .value,
                      ),
                  })
                }
                required
              />
            </label>


            <label className="form-full">
              <span>
                Stock máximo
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  form.maximum_stock ??
                  ""
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    maximum_stock:
                      event.target
                        .value ===
                      ""
                        ? null
                        : Number(
                            event
                              .target
                              .value,
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
              disabled={saving}
              onClick={() => {
                setModalOpen(
                  false,
                );
                setFormError("");
                setForm(initialForm);
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving
                ? "Guardando..."
                : "Guardar producto"}
            </button>
          </div>
        </form>
      </Modal>


      <Modal
        open={editModalOpen}
        title="Editar producto"
        description="Actualiza los datos comerciales del producto."
        onClose={() => {
          if (!saving) {
            setEditModalOpen(false);
            setEditingProduct(null);
            setFormError("");
            setForm(initialForm);
          }
        }}
      >
        <form
          className="enterprise-form"
          onSubmit={
            handleUpdateProduct
          }
        >
          {formError && (
            <ModuleState
              type="error"
              title="No se pudo actualizar"
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
                      event.target
                        .value,
                  })
                }
                required
              />
            </label>


            <label>
              <span>
                Categoría
              </span>

              <select
                value={
                  form.category_id ??
                  ""
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    category_id:
                      event.target
                        .value ||
                      null,
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
        "active" ||
      category.id ===
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
                      event.target
                        .value,
                  })
                }
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
                  form.description ??
                  ""
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    description:
                      event.target
                        .value,
                  })
                }
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
                      event.target
                        .value,
                  })
                }
                required
              />
            </label>


            <label>
              <span>
                Estado
              </span>

              <select
                value={
                  form.status ??
                  "active"
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    status:
                      event.target
                        .value as
                        | "active"
                        | "inactive",
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
                        event.target
                          .value,
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
                        event.target
                          .value,
                      ),
                  })
                }
                required
              />
            </label>


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
                        event.target
                          .value,
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
                  form.maximum_stock ??
                  ""
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    maximum_stock:
                      event.target
                        .value ===
                      ""
                        ? null
                        : Number(
                            event
                              .target
                              .value,
                          ),
                  })
                }
              />
            </label>
          </div>


          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={saving}
              onClick={() => {
                setEditModalOpen(
                  false,
                );
                setEditingProduct(
                  null,
                );
                setFormError("");
                setForm(initialForm);
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving
                ? "Guardando..."
                : "Guardar cambios"}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}


export default ProductosPage;