import {
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  Building2,
  MapPin,
  Pencil,
  Plus,
  Search,
} from "lucide-react";

import DataTable, {
  type DataTableColumn,
} from "../../components/ui/DataTable";

import ExportActions from "../../components/ui/ExportActions";
import Modal from "../../components/ui/Modal";
import ModuleState from "../../components/ui/ModuleState";
import Pagination from "../../components/ui/Pagination";

import {
  createBranch,
  getBranches,
  updateBranch,
} from "../../services/organization.service";

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
  Branch,
  BranchCreate,
  BranchUpdate,
} from "../../types/organization";

import "./sucursales-commercial.css";


const PAGE_SIZE = 8;


interface BranchForm {
  code: string;
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;

  status:
    | "active"
    | "inactive";
}


const initialForm:
  BranchForm = {
    code: "",
    name: "",
    address: "",
    city: "",
    country: "Perú",
    phone: "",
    email: "",
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
    ? "Activa"
    : "Inactiva";
}


function locationLabel(
  branch: Branch,
) {
  return [
    branch.address,
    branch.city,
    branch.country,
  ]
    .filter(Boolean)
    .join(", ")
    || "Sin ubicación";
}


function contactLabel(
  branch: Branch,
) {
  return (
    branch.phone
    || branch.email
    || "Sin contacto"
  );
}


function exportRows(
  branches: Branch[],
): ExportRow[] {
  return branches.map(
    (branch) => ({
      Código:
        branch.code,

      Sucursal:
        branch.name,

      Dirección:
        branch.address
        ?? "",

      Ciudad:
        branch.city
        ?? "",

      País:
        branch.country
        ?? "",

      Teléfono:
        branch.phone
        ?? "",

      Correo:
        branch.email
        ?? "",

      Estado:
        statusLabel(
          branch.status,
        ),
    }),
  );
}


export default function SucursalesPage() {
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
      getBranches,
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
    editingBranch,
    setEditingBranch,
  ] =
    useState<Branch | null>(
      null,
    );


  const [
    form,
    setForm,
  ] =
    useState<BranchForm>(
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


  const branches =
    data ?? [];


  const filteredBranches =
    useMemo(
      () => {
        const query =
          normalize(
            search,
          );


        return branches.filter(
          (branch) => {
            const matchesSearch =
              !query
              || [
                branch.code,
                branch.name,
                branch.address,
                branch.city,
                branch.country,
                branch.phone,
                branch.email,
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
              || branch.status ===
                statusFilter;


            return (
              matchesSearch
              && matchesStatus
            );
          },
        );
      },
      [
        branches,
        search,
        statusFilter,
      ],
    );


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredBranches.length
        / PAGE_SIZE,
      ),
    );


  const safePage =
    Math.min(
      page,
      totalPages,
    );


  const paginatedBranches =
    useMemo(
      () => {
        const start =
          (
            safePage - 1
          )
          * PAGE_SIZE;


        return filteredBranches.slice(
          start,
          start + PAGE_SIZE,
        );
      },
      [
        filteredBranches,
        safePage,
      ],
    );


  const columns:
    DataTableColumn<Branch>[] = [
      {
        key:
          "code",

        label:
          "Código",

        render:
          (branch) => (
            <strong className="branch-code">
              {branch.code}
            </strong>
          ),
      },

      {
        key:
          "branch",

        label:
          "Sucursal",

        render:
          (branch) => (
            <div className="branch-cell">
              <div className="branch-avatar">
                <Building2
                  size={16}
                />
              </div>

              <div>
                <strong>
                  {branch.name}
                </strong>

                <span>
                  {branch.city
                    || branch.country
                    || "Sin ubicación"}
                </span>
              </div>
            </div>
          ),
      },

      {
        key:
          "location",

        label:
          "Ubicación",

        render:
          (branch) => (
            <span className="branch-detail">
              <MapPin
                size={13}
              />

              {locationLabel(
                branch,
              )}
            </span>
          ),
      },

      {
        key:
          "contact",

        label:
          "Contacto",

        render:
          (branch) => (
            <span className="branch-contact">
              {contactLabel(
                branch,
              )}
            </span>
          ),
      },

      {
        key:
          "status",

        label:
          "Estado",

        render:
          (branch) => (
            <span
              className={`status-badge ${
                branch.status ===
                  "active"
                  ? "success"
                  : "inactive"
              }`}
            >
              {statusLabel(
                branch.status,
              )}
            </span>
          ),
      },
    ];


  function resetForm() {
    setForm(
      initialForm,
    );

    setEditingBranch(
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
    branch: Branch,
  ) {
    setEditingBranch(
      branch,
    );

    setForm({
      code:
        branch.code,

      name:
        branch.name,

      address:
        branch.address
        ?? "",

      city:
        branch.city
        ?? "",

      country:
        branch.country
        || "Perú",

      phone:
        branch.phone
        ?? "",

      email:
        branch.email
        ?? "",

      status:
        branch.status ===
          "inactive"
          ? "inactive"
          : "active",
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


    if (
      !form.code.trim()
      || !form.name.trim()
    ) {
      setFormError(
        "Código y nombre son obligatorios.",
      );

      return;
    }


    if (
      form.email.trim()
      && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim(),
      )
    ) {
      setFormError(
        "Ingresa un correo electrónico válido.",
      );

      return;
    }


    setSaving(
      true,
    );


    try {
      if (
        editingBranch
      ) {
        const payload:
          BranchUpdate = {
            code:
              form.code.trim(),

            name:
              form.name.trim(),

            address:
              form.address
                .trim()
              || null,

            city:
              form.city
                .trim()
              || null,

            country:
              form.country
                .trim()
              || null,

            phone:
              form.phone
                .trim()
              || null,

            email:
              form.email
                .trim()
              || null,

            status:
              form.status,
          };


        await updateBranch(
          editingBranch.id,
          payload,
        );


        setSuccessMessage(
          "Sucursal actualizada correctamente.",
        );
      } else {
        const payload:
          BranchCreate = {
            code:
              form.code.trim(),

            name:
              form.name.trim(),

            address:
              form.address
                .trim()
              || null,

            city:
              form.city
                .trim()
              || null,

            country:
              form.country
                .trim()
              || "Perú",

            phone:
              form.phone
                .trim()
              || null,

            email:
              form.email
                .trim()
              || null,

            status:
              form.status,
          };


        await createBranch(
          payload,
        );


        setSuccessMessage(
          "Sucursal registrada correctamente.",
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
          : editingBranch
            ? "No se pudo actualizar la sucursal."
            : "No se pudo registrar la sucursal.",
      );
    } finally {
      setSaving(
        false,
      );
    }
  }


  function exportFilename() {
    return `sucursales-${exportDateStamp()}`;
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
          filteredBranches,
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
        "Sucursales",
        exportRows(
          filteredBranches,
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
          "Sucursales - SalesIA Enterprise",
          "Listado de sucursales de SalesIA Enterprise.",
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
      className="branches-page"
    >
      <div className="branches-title">
        <span>
          Estructura organizacional
        </span>

        <h2>
          Sucursales
        </h2>

        <p>
          {filteredBranches.length}{" "}
          {filteredBranches.length ===
            1
            ? "sucursal"
            : "sucursales"}
          {" "}
          en la vista actual
        </p>
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
        className="branches-toolbar"
        data-export-hide="true"
      >
        <div className="branches-filters">
          <label className="branches-search">
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
              placeholder="Buscar sucursal..."
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


        <div className="branches-toolbar-actions">
          <ExportActions
            disabled={
              loading
              || filteredBranches.length ===
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
            className="primary-button branches-new-button"
            onClick={
              openCreate
            }
          >
            <Plus
              size={15}
            />

            Nueva sucursal
          </button>
        </div>
      </div>


      <article className="branches-table-panel">
        {loading ? (
          <ModuleState
            type="loading"
            title="Cargando sucursales"
            description="Consultando sucursales registradas."
          />
        ) : error ? (
          <div>
            <ModuleState
              type="error"
              title="No se pudieron cargar las sucursales"
              description={
                error
              }
            />

            <div
              className="branches-retry"
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
        ) : filteredBranches.length ===
          0 ? (
          <ModuleState
            type="empty"
            title={
              search
              || statusFilter
                ? "No encontramos sucursales"
                : "Todavía no hay sucursales"
            }
            description={
              search
              || statusFilter
                ? "No existen sucursales que coincidan con los filtros."
                : "No existen sucursales registradas."
            }
          />
        ) : (
          <>
            <DataTable
              columns={
                columns
              }
              data={
                paginatedBranches
              }
              getRowKey={(
                branch,
              ) =>
                branch.id
              }
              actions={(
                branch,
              ) => (
                <div className="table-actions">
                  <button
                    type="button"
                    className="icon-button"
                    title="Editar sucursal"
                    disabled={
                      saving
                    }
                    onClick={() =>
                      openEdit(
                        branch,
                      )
                    }
                  >
                    <Pencil
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
          editingBranch
            ? "Editar sucursal"
            : "Registrar sucursal"
        }
        description={
          editingBranch
            ? "Actualiza la información de la sucursal."
            : "Registra un nuevo establecimiento de la empresa."
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
                editingBranch
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
                Código
              </span>

              <input
                value={
                  form.code
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    code:
                      event.target.value,
                  })
                }
                placeholder="Ej. LIM-001"
                required
              />
            </label>


            <label>
              <span>
                Nombre
              </span>

              <input
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
                placeholder="Sucursal principal"
                required
              />
            </label>


            <label>
              <span>
                Ciudad
              </span>

              <input
                value={
                  form.city
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    city:
                      event.target.value,
                  })
                }
                placeholder="Lima"
              />
            </label>


            <label>
              <span>
                País
              </span>

              <input
                value={
                  form.country
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    country:
                      event.target.value,
                  })
                }
                placeholder="Perú"
              />
            </label>


            <label className="form-full">
              <span>
                Dirección
              </span>

              <input
                value={
                  form.address
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    address:
                      event.target.value,
                  })
                }
                placeholder="Dirección de la sucursal"
              />
            </label>


            <label>
              <span>
                Teléfono
              </span>

              <input
                value={
                  form.phone
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    phone:
                      event.target.value,
                  })
                }
                placeholder="+51 999 999 999"
              />
            </label>


            <label>
              <span>
                Correo electrónico
              </span>

              <input
                type="email"
                value={
                  form.email
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    email:
                      event.target.value,
                  })
                }
                placeholder="sucursal@empresa.com"
              />
            </label>


            <label className="form-full">
              <span>
                Estado
              </span>

              <select
                value={
                  form.status
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
                  Activa
                </option>

                <option value="inactive">
                  Inactiva
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
                : editingBranch
                  ? "Actualizar sucursal"
                  : "Guardar sucursal"}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
