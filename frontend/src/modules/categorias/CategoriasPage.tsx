import {
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
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
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../../services/commercial.service";

import {
  useApiResource,
} from "../../hooks/useApiResource";

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
  Category,
  CategoryCreate,
} from "../../types/commercial";

import "./categorias-commercial.css";


const PAGE_SIZE = 8;


const initialForm: CategoryCreate = {
  name: "",
  description: "",
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


function statusLabel(
  status: string,
) {
  return status === "active"
    ? "Activo"
    : "Inactivo";
}


function exportRows(
  categories: Category[],
): ExportRow[] {
  return categories.map(
    (category) => ({
      Categoría:
        category.name,

      Descripción:
        category.description
        ?? "",

      Estado:
        statusLabel(
          category.status,
        ),
    }),
  );
}


export default function CategoriasPage() {
  const exportRef =
    useRef<HTMLElement>(
      null,
    );


  const {
    data,
    loading,
    error,
    reload,
  } =
    useApiResource(
      getCategories,
    );


  const [
    search,
    setSearch,
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
    editingCategory,
    setEditingCategory,
  ] =
    useState<Category | null>(
      null,
    );


  const [
    form,
    setForm,
  ] =
    useState<CategoryCreate>(
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


  const categories =
    data ?? [];


  const filteredCategories =
    useMemo(
      () => {
        const query =
          normalize(
            search,
          );

        return categories.filter(
          (category) => {
            const matchesSearch =
              !query
              || [
                category.name,
                category.description,
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


            const matchesStatus =
              !statusFilter
              || category.status ===
                statusFilter;


            return (
              matchesSearch
              && matchesStatus
            );
          },
        );
      },
      [
        categories,
        search,
        statusFilter,
      ],
    );


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredCategories.length
        / PAGE_SIZE,
      ),
    );


  const safePage =
    Math.min(
      page,
      totalPages,
    );


  const paginatedCategories =
    useMemo(
      () => {
        const start =
          (
            safePage - 1
          )
          * PAGE_SIZE;

        return filteredCategories.slice(
          start,
          start + PAGE_SIZE,
        );
      },
      [
        filteredCategories,
        safePage,
      ],
    );


  const columns:
    DataTableColumn<Category>[] = [
      {
        key:
          "category",

        label:
          "Categoría",

        render:
          (category) => (
            <div className="category-cell">
              <div className="category-avatar">
                <Tags
                  size={16}
                />
              </div>

              <div>
                <strong>
                  {category.name}
                </strong>

                <span>
                  Clasificación de productos
                </span>
              </div>
            </div>
          ),
      },

      {
        key:
          "description",

        label:
          "Descripción",

        render:
          (category) => (
            <span className="category-description">
              {category.description
                || "Sin descripción"}
            </span>
          ),
      },

      {
        key:
          "status",

        label:
          "Estado",

        render:
          (category) => (
            <span
              className={`status-badge ${
                category.status ===
                  "active"
                  ? "success"
                  : "inactive"
              }`}
            >
              {statusLabel(
                category.status,
              )}
            </span>
          ),
      },
    ];


  function resetForm() {
    setForm(
      initialForm,
    );

    setEditingCategory(
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
    category: Category,
  ) {
    setEditingCategory(
      category,
    );

    setForm({
      name:
        category.name,

      description:
        category.description
        ?? "",

      status:
        category.status ===
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

    setSaving(
      true,
    );


    const payload: CategoryCreate = {
      name:
        form.name.trim(),

      description:
        form.description
          ?.trim()
        || null,

      status:
        form.status
        ?? "active",
    };


    try {
      if (
        editingCategory
      ) {
        await updateCategory(
          editingCategory.id,
          payload,
        );

        setSuccessMessage(
          "Categoría actualizada correctamente.",
        );
      } else {
        await createCategory(
          payload,
        );

        setSuccessMessage(
          "Categoría registrada correctamente.",
        );
      }


      setModalOpen(
        false,
      );

      resetForm();

      setPage(
        1,
      );

      await reload();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : editingCategory
            ? "No se pudo actualizar la categoría."
            : "No se pudo registrar la categoría.",
      );
    } finally {
      setSaving(
        false,
      );
    }
  }


  async function handleDeactivate(
    category: Category,
  ) {
    if (
      category.status !==
      "active"
    ) {
      return;
    }


    const confirmed =
      window.confirm(
        `¿Deseas desactivar la categoría "${category.name}"?`,
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
      await deleteCategory(
        category.id,
      );

      await reload();

      setSuccessMessage(
        "Categoría desactivada correctamente.",
      );
    } catch (err) {
      setOperationError(
        err instanceof Error
          ? err.message
          : "No se pudo desactivar la categoría.",
      );
    } finally {
      setSaving(
        false,
      );
    }
  }


  function exportFilename() {
    return `categorias-${exportDateStamp()}`;
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
    } catch (err) {
      setOperationError(
        err instanceof Error
          ? err.message
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
          filteredCategories,
        ),
      );
    } catch (err) {
      setOperationError(
        err instanceof Error
          ? err.message
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
        "Categorías",
        exportRows(
          filteredCategories,
        ),
      );
    } catch (err) {
      setOperationError(
        err instanceof Error
          ? err.message
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
          "Categorías - SalesIA Enterprise",
          "Catálogo de categorías de SalesIA Enterprise.",
        );


      if (
        result ===
        "downloaded"
      ) {
        setSuccessMessage(
          "El navegador no permite compartir el archivo directamente. El PDF fue descargado para que puedas enviarlo manualmente.",
        );
      }
    } catch (err) {
      setOperationError(
        err instanceof Error
          ? err.message
          : "No se pudo compartir el archivo.",
      );
    }
  }


  return (
    <section
      ref={exportRef}
      className="categories-page"
    >
      <div className="categories-title">
        <div>
          <span>
            Organización del catálogo
          </span>

          <h2>
            Categorías
          </h2>

          <p>
            {filteredCategories.length}{" "}
            {filteredCategories.length ===
              1
              ? "categoría"
              : "categorías"}
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
        className="categories-toolbar"
        data-export-hide="true"
      >
        <div className="categories-filters">
          <label className="categories-search">
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
              placeholder="Buscar categoría..."
            />
          </label>


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
              Activas
            </option>

            <option value="inactive">
              Inactivas
            </option>
          </select>
        </div>


        <div className="categories-toolbar-actions">
          <ExportActions
            disabled={
              loading
              || filteredCategories.length ===
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


          <button
            type="button"
            className="primary-button categories-new-button"
            onClick={
              openCreate
            }
          >
            <Plus
              size={15}
            />

            Nueva categoría
          </button>
        </div>
      </div>


      <article className="categories-table-panel">
        {loading ? (
          <ModuleState
            type="loading"
            title="Cargando categorías"
            description="Consultando categorías registradas."
          />
        ) : error ? (
          <div>
            <ModuleState
              type="error"
              title="No se pudieron cargar las categorías"
              description={
                error
              }
            />

            <div
              className="categories-retry"
              data-export-hide="true"
            >
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  void reload()
                }
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : filteredCategories.length ===
          0 ? (
          <ModuleState
            type="empty"
            title={
              search
              || statusFilter
                ? "No encontramos categorías"
                : "Todavía no hay categorías"
            }
            description={
              search
              || statusFilter
                ? "No existen categorías que coincidan con los filtros."
                : "No existen categorías registradas."
            }
          />
        ) : (
          <>
            <DataTable
              columns={
                columns
              }
              data={
                paginatedCategories
              }
              getRowKey={(
                category,
              ) =>
                category.id
              }
              actions={(
                category,
              ) => (
                <div className="table-actions">
                  <button
                    type="button"
                    className="icon-button"
                    title="Editar categoría"
                    disabled={
                      saving
                    }
                    onClick={() =>
                      openEdit(
                        category,
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
                    title="Desactivar categoría"
                    disabled={
                      saving
                      || category.status !==
                        "active"
                    }
                    onClick={() =>
                      void handleDeactivate(
                        category,
                      )
                    }
                  >
                    <Trash2
                      size={15}
                    />
                  </button>
                </div>
              )}
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
          editingCategory
            ? "Editar categoría"
            : "Registrar categoría"
        }
        description={
          editingCategory
            ? "Actualiza los datos de la categoría."
            : "Registra una nueva categoría para organizar los productos."
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
                editingCategory
                  ? "No se pudo actualizar"
                  : "No se pudo registrar"
              }
              description={
                formError
              }
            />
          )}


          <div className="form-grid">
            <label className="form-full">
              <span>
                Nombre
              </span>

              <input
                type="text"
                minLength={2}
                maxLength={120}
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
                placeholder="Ej. Tecnología"
                required
              />
            </label>


            <label className="form-full">
              <span>
                Descripción
              </span>

              <textarea
                maxLength={500}
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
                placeholder="Descripción de la categoría"
              />
            </label>


            <label className="form-full">
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
                : editingCategory
                  ? "Actualizar categoría"
                  : "Guardar categoría"}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
