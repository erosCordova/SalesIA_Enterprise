import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  CheckCircle2,
  FileText,
  Tags,
  UserX,
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
  createCategory,
  getCategories,
} from "../../services/commercial.service";

import {
  useApiResource,
} from "../../hooks/useApiResource";

import type {
  Category,
  CategoryCreate,
} from "../../types/commercial";


const PAGE_SIZE = 8;


const initialForm: CategoryCreate = {
  name: "",
  description: "",
  status: "active",
};


function CategoriasPage() {
  const {
    data,
    loading,
    error,
    reload,
  } = useApiResource(
    getCategories,
  );

  const [
    search,
    setSearch,
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
  ] = useState<CategoryCreate>(
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


  const categories =
    data ?? [];


  const filteredCategories =
    useMemo(
      () => {
        const query =
          search
            .toLowerCase()
            .trim();

        if (!query) {
          return categories;
        }

        return categories.filter(
          (category) =>
            [
              category.name,
              category.description,
              category.status,
            ].some(
              (value) =>
                String(value ?? "")
                  .toLowerCase()
                  .includes(query),
            ),
        );
      },
      [
        categories,
        search,
      ],
    );


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredCategories.length /
          PAGE_SIZE,
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
          (safePage - 1) *
          PAGE_SIZE;

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


  const activeCategories =
    categories.filter(
      (category) =>
        category.status === "active",
    ).length;


  const inactiveCategories =
    categories.filter(
      (category) =>
        category.status !== "active",
    ).length;


  const categoriesWithDescription =
    categories.filter(
      (category) =>
        Boolean(
          category.description?.trim(),
        ),
    ).length;


  const activePercentage =
    categories.length > 0
      ? Math.round(
          (
            activeCategories /
            categories.length
          ) * 100,
        )
      : 0;


  const descriptionPercentage =
    categories.length > 0
      ? Math.round(
          (
            categoriesWithDescription /
            categories.length
          ) * 100,
        )
      : 0;


  const columns:
    DataTableColumn<Category>[] = [
      {
        key: "category",
        label: "Categoría",
        render: (category) => (
          <div className="customer-cell">
            <div className="customer-avatar">
              <Tags size={17} />
            </div>

            <div>
              <strong>
                {category.name}
              </strong>

              <span>
                Catálogo comercial
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "description",
        label: "Descripción",
        render: (category) => (
          <span>
            {category.description ||
              "Sin descripción"}
          </span>
        ),
      },
      {
        key: "status",
        label: "Estado",
        render: (category) => (
          <span
            className={`status-badge ${
              category.status ===
              "active"
                ? "success"
                : "inactive"
            }`}
          >
            {category.status ===
            "active"
              ? "Activo"
              : "Inactivo"}
          </span>
        ),
      },
    ];


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");
    setSaving(true);

    try {
      await createCategory({
        name:
          form.name.trim(),

        description:
          form.description?.trim() ||
          null,

        status:
          form.status ??
          "active",
      });

      setForm(initialForm);
      setModalOpen(false);
      setPage(1);

      await reload();

      setSuccessMessage(
        "Categoría registrada correctamente.",
      );
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "No se pudo registrar la categoría.",
      );
    } finally {
      setSaving(false);
    }
  }


  return (
    <section className="module-page">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">
            ORGANIZACIÓN DEL CATÁLOGO
          </span>

          <h1>
            Categorías
          </h1>

          <p>
            Organiza y clasifica los
            productos utilizando las
            categorías registradas en
            SalesIA Enterprise.
          </p>
        </div>

        <div className="module-main-icon">
          <Tags size={27} />
        </div>
      </div>


      {successMessage && (
        <ModuleState
          type="success"
          title="Categoría registrada"
          description={
            successMessage
          }
        />
      )}


      <div className="stats-grid">
        <StatCard
          title="Categorías registradas"
          value={String(
            categories.length,
          )}
          change="100%"
          caption="catálogo actual"
          icon={Tags}
        />

        <StatCard
          title="Categorías activas"
          value={String(
            activeCategories,
          )}
          change={`${activePercentage}%`}
          caption="disponibles para uso"
          icon={CheckCircle2}
        />

        <StatCard
          title="Categorías inactivas"
          value={String(
            inactiveCategories,
          )}
          change={
            categories.length > 0
              ? `${Math.round(
                  (
                    inactiveCategories /
                    categories.length
                  ) * 100,
                )}%`
              : "0%"
          }
          positive={
            inactiveCategories === 0
          }
          caption="fuera de operación"
          icon={UserX}
        />

        <StatCard
          title="Con descripción"
          value={String(
            categoriesWithDescription,
          )}
          change={`${descriptionPercentage}%`}
          caption="documentadas"
          icon={FileText}
        />
      </div>


      <article className="panel enterprise-data-panel">
        <TableToolbar
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          createLabel="Nueva categoría"
          onCreate={() => {
            setFormError("");
            setModalOpen(true);
          }}
        />


        {loading ? (
          <ModuleState
            type="loading"
            title="Cargando categorías"
            description="Consultando categorías registradas en PostgreSQL."
          />
        ) : error ? (
          <div>
            <ModuleState
              type="error"
              title="No se pudieron cargar las categorías"
              description={error}
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
                  void reload();
                }}
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
                ? "No encontramos categorías"
                : "Todavía no hay categorías"
            }
            description={
              search
                ? "Prueba con otro término de búsqueda."
                : "Registra la primera categoría desde el botón Nueva categoría."
            }
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={
                paginatedCategories
              }
              getRowKey={(
                category,
              ) => category.id}
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
        title="Registrar nueva categoría"
        description="La categoría será almacenada mediante la API de SalesIA Enterprise."
        onClose={() => {
          if (!saving) {
            setModalOpen(false);
            setFormError("");
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
                      event.target
                        .value,
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
                placeholder="Descripción de la categoría"
              />
            </label>


            <label className="form-full">
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
                : "Guardar categoría"}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}


export default CategoriasPage;
