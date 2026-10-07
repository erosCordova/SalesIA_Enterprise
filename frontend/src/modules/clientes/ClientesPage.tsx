import {
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  Eye,
  History,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  UserRound,
  UserX,
} from "lucide-react";

import DataTable, {
  type DataTableColumn,
} from "../../components/ui/DataTable";

import ExportActions from "../../components/ui/ExportActions";
import Modal from "../../components/ui/Modal";
import ModuleState from "../../components/ui/ModuleState";
import Pagination from "../../components/ui/Pagination";

import {
  createCustomer,
  deleteCustomer,
  getCustomerHistory,
  getCustomers,
  updateCustomer,
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
  Customer,
  CustomerCreate,
  CustomerHistoryItem,
} from "../../types/commercial";

import "./clientes-commercial.css";


const PAGE_SIZE =
  8;


type StatusFilter =
  | "all"
  | "active"
  | "inactive";


const initialForm:
  CustomerCreate = {
    document_type: "DNI",
    document_number: "",
    first_name: "",
    last_name: "",
    business_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
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
      ?.normalize(
        "NFD",
      )
      .replace(
        /[\u0300-\u036f]/g,
        "",
      )
      .trim()
      .toLowerCase()
    ?? ""
  );
}


function customerName(
  customer: Customer,
) {
  const fullName = [
    customer.first_name,
    customer.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    fullName
    || customer.business_name
    || "Cliente sin nombre"
  );
}


function statusLabel(
  status: string,
) {
  return status === "active"
    ? "Activo"
    : "Inactivo";
}


function saleStatusLabel(
  status: string,
) {
  const dictionary:
    Record<string, string> = {
      completed:
        "Completada",

      complete:
        "Completada",

      cancelled:
        "Anulada",

      canceled:
        "Anulada",

      pending:
        "Pendiente",

      active:
        "Activa",

      inactive:
        "Inactiva",
    };

  return (
    dictionary[
      normalize(
        status,
      )
    ]
    ?? status
  );
}


function currency(
  value:
    | number
    | string,
) {
  const numeric =
    Number(value);

  if (
    !Number.isFinite(
      numeric,
    )
  ) {
    return String(
      value,
    );
  }

  return new Intl.NumberFormat(
    "es-PE",
    {
      style:
        "currency",

      currency:
        "PEN",

      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2,
    },
  ).format(
    numeric,
  );
}


function dateValue(
  value: string,
) {
  const date =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "es-PE",
    {
      dateStyle:
        "medium",
    },
  ).format(
    date,
  );
}


function exportRows(
  customers:
    Customer[],
): ExportRow[] {
  return customers.map(
    (
      customer,
    ) => ({
      Cliente:
        customerName(
          customer,
        ),

      "Tipo de documento":
        customer.document_type
        || "",

      "DNI":
        customer.document_number
        || "",

      "Razón social":
        customer.business_name
        || "",

      Correo:
        customer.email
        || "",

      Teléfono:
        customer.phone
        || "",

      Dirección:
        customer.address
        || "",

      Ciudad:
        customer.city
        || "",

      Estado:
        statusLabel(
          customer.status,
        ),
    }),
  );
}


export default function ClientesPage() {
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
      getCustomers,
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
    useState<StatusFilter>(
      "all",
    );


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
    form,
    setForm,
  ] =
    useState<CustomerCreate>(
      initialForm,
    );


  const [
    editingCustomer,
    setEditingCustomer,
  ] =
    useState<Customer | null>(
      null,
    );


  const [
    viewingCustomer,
    setViewingCustomer,
  ] =
    useState<Customer | null>(
      null,
    );


  const [
    historyOpen,
    setHistoryOpen,
  ] =
    useState(false);


  const [
    history,
    setHistory,
  ] =
    useState<
      CustomerHistoryItem[]
    >([]);


  const [
    historyLoading,
    setHistoryLoading,
  ] =
    useState(false);


  const [
    historyError,
    setHistoryError,
  ] =
    useState("");


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
    exportError,
    setExportError,
  ] =
    useState("");


  const customers =
    data ?? [];


  const filteredCustomers =
    useMemo(
      () => {
        const query =
          normalize(
            search,
          );

        return customers.filter(
          (
            customer,
          ) => {
            const matchesSearch =
              !query
              || [
                customer.first_name,
                customer.last_name,
                customer.business_name,
                customer.document_type,
                customer.document_number,
                customer.email,
                customer.phone,
                customer.address,
                customer.city,
              ].some(
                (
                  value,
                ) =>
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
              statusFilter ===
                "all"
              || customer.status ===
                statusFilter;


            return (
              matchesSearch
              && matchesStatus
            );
          },
        );
      },
      [
        customers,
        search,
        statusFilter,
      ],
    );


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredCustomers
          .length
        / PAGE_SIZE,
      ),
    );


  const safePage =
    Math.min(
      page,
      totalPages,
    );


  const paginatedCustomers =
    useMemo(
      () => {
        const start =
          (
            safePage - 1
          )
          * PAGE_SIZE;

        return filteredCustomers.slice(
          start,
          start
          + PAGE_SIZE,
        );
      },
      [
        filteredCustomers,
        safePage,
      ],
    );


  const columns:
    DataTableColumn<Customer>[] = [
      {
        key:
          "customer",

        label:
          "Cliente",

        render:
          (
            customer,
          ) => (
            <div className="customer-cell">
              <div className="customer-avatar">
                <UserRound
                  size={16}
                />
              </div>

              <div>
                <strong>
                  {customerName(
                    customer,
                  )}
                </strong>

                <span>
                  {customer.business_name
                    || customer.document_type
                    || "Cliente"}
                </span>
              </div>
            </div>
          ),
      },

      {
        key:
          "document",

        label:
          "Documento",

        render:
          (
            customer,
          ) => (
            <span>
              {customer.document_type
                ? `${customer.document_type} · `
                : ""}

              {customer.document_number
                || "Sin documento"}
            </span>
          ),
      },

      {
        key:
          "email",

        label:
          "Correo",

        render:
          (
            customer,
          ) => (
            <span className="customer-contact">
              <Mail
                size={13}
              />

              {customer.email
                || "Sin correo"}
            </span>
          ),
      },

      {
        key:
          "phone",

        label:
          "Teléfono",

        render:
          (
            customer,
          ) => (
            <span className="customer-contact">
              <Phone
                size={13}
              />

              {customer.phone
                || "Sin teléfono"}
            </span>
          ),
      },

      {
        key:
          "location",

        label:
          "Ubicación",

        render:
          (
            customer,
          ) => (
            <span className="customer-contact">
              <MapPin
                size={13}
              />

              {customer.city
                || customer.address
                || "Sin ubicación"}
            </span>
          ),
      },

      {
        key:
          "status",

        label:
          "Estado",

        render:
          (
            customer,
          ) => (
            <span
              className={`status-badge ${
                customer.status ===
                  "active"
                  ? "success"
                  : "inactive"
              }`}
            >
              {statusLabel(
                customer.status,
              )}
            </span>
          ),
      },
    ];


  function resetForm() {
    setForm(
      initialForm,
    );

    setEditingCustomer(
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

    setModalOpen(
      true,
    );
  }


  function openEdit(
    customer: Customer,
  ) {
    setEditingCustomer(
      customer,
    );

    setForm({
      document_type:
        customer.document_type
        || "",

      document_number:
        customer.document_number
        || "",

      first_name:
        customer.first_name
        || "",

      last_name:
        customer.last_name
        || "",

      business_name:
        customer.business_name
        || "",

      email:
        customer.email
        || "",

      phone:
        customer.phone
        || "",

      address:
        customer.address
        || "",

      city:
        customer.city
        || "",

      status:
        customer.status ===
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

    setSaving(
      true,
    );

    try {
      const payload:
        CustomerCreate = {
          ...form,

          document_type:
            form.document_type
              .trim(),

          document_number:
            form.document_number
              .trim(),

          first_name:
            form.first_name
              ?.trim()
            || null,

          last_name:
            form.last_name
              ?.trim()
            || null,

          business_name:
            form.business_name
              ?.trim()
            || null,

          email:
            form.email
              ?.trim()
            || null,

          phone:
            form.phone
              ?.trim()
            || null,

          address:
            form.address
              ?.trim()
            || null,

          city:
            form.city
              ?.trim()
            || null,
        };


      if (
        editingCustomer
      ) {
        await updateCustomer(
          editingCustomer.id,
          payload,
        );

        setSuccessMessage(
          "Cliente actualizado correctamente.",
        );
      } else {
        await createCustomer(
          payload,
        );

        setSuccessMessage(
          "Cliente registrado correctamente.",
        );
      }


      resetForm();

      setModalOpen(
        false,
      );

      setPage(
        1,
      );

      await reload();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar el cliente.",
      );
    } finally {
      setSaving(
        false,
      );
    }
  }


  async function handleDeactivate(
    customer:
      Customer,
  ) {
    if (
      customer.status !==
      "active"
    ) {
      return;
    }


    const confirmed =
      window.confirm(
        `¿Deseas desactivar a ${customerName(
          customer,
        )}?`,
      );


    if (
      !confirmed
    ) {
      return;
    }


    try {
      await deleteCustomer(
        customer.id,
      );

      setSuccessMessage(
        "Cliente desactivado correctamente.",
      );

      await reload();
    } catch (err) {
      setSuccessMessage(
        "",
      );

      setExportError(
        err instanceof Error
          ? err.message
          : "No se pudo desactivar el cliente.",
      );
    }
  }


  async function handleHistory(
    customer:
      Customer,
  ) {
    setHistoryOpen(
      true,
    );

    setHistory(
      [],
    );

    setHistoryError(
      "",
    );

    setHistoryLoading(
      true,
    );

    try {
      const result =
        await getCustomerHistory(
          customer.id,
        );

      setHistory(
        result,
      );
    } catch (err) {
      setHistory(
        [],
      );

      setHistoryError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el historial.",
      );
    } finally {
      setHistoryLoading(
        false,
      );
    }
  }


  function updateFormField(
    field:
      keyof CustomerCreate,

    value:
      string,
  ) {
    setForm(
      (
        current,
      ) => ({
        ...current,
        [field]:
          value,
      }),
    );
  }


  function exportFilename() {
    return `clientes-${exportDateStamp()}`;
  }


  async function handlePdf() {
    if (
      !exportRef.current
    ) {
      return;
    }

    setExportError(
      "",
    );

    try {
      await downloadVisualPdf(
        exportRef.current,
        exportFilename(),
      );
    } catch (err) {
      setExportError(
        err instanceof Error
          ? err.message
          : "No se pudo generar el PDF.",
      );
    }
  }


  function handleCsv() {
    setExportError(
      "",
    );

    try {
      exportRowsToCsv(
        exportFilename(),
        exportRows(
          filteredCustomers,
        ),
      );
    } catch (err) {
      setExportError(
        err instanceof Error
          ? err.message
          : "No se pudo generar el CSV.",
      );
    }
  }


  async function handleExcel() {
    setExportError(
      "",
    );

    try {
      await exportRowsToExcel(
        exportFilename(),
        "Clientes",
        exportRows(
          filteredCustomers,
        ),
      );
    } catch (err) {
      setExportError(
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

    setExportError(
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
          "Clientes - SalesIA Enterprise",
          "Listado de clientes de SalesIA Enterprise.",
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
      setExportError(
        err instanceof Error
          ? err.message
          : "No se pudo compartir el archivo.",
      );
    }
  }


  return (
    <section
      ref={exportRef}
      className="customers-page"
    >
      <div className="customers-title">
        <div>
          <span>
            Gestión comercial
          </span>

          <h2>
            Clientes
          </h2>

          <p>
            {filteredCustomers.length}{" "}
            {filteredCustomers.length ===
              1
              ? "cliente"
              : "clientes"}
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


      {exportError && (
        <ModuleState
          type="error"
          title="No se pudo completar la operación"
          description={
            exportError
          }
        />
      )}


      <div
        className="customers-toolbar"
        data-export-hide="true"
      >
        <div className="customers-filters">
          <label className="customers-search">
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
                  event
                    .target
                    .value,
                );

                setPage(
                  1,
                );
              }}
              placeholder="Buscar cliente..."
            />
          </label>


          <select
            className="customers-status-filter"
            value={
              statusFilter
            }
            onChange={(
              event,
            ) => {
              setStatusFilter(
                event.target.value as StatusFilter,
              );

              setPage(
                1,
              );
            }}
          >
            <option value="all">
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


        <div className="customers-toolbar-actions">
          <ExportActions
            disabled={
              loading
              || filteredCustomers
                .length === 0
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
            className="primary-button customers-new-button"
            onClick={
              openCreate
            }
          >
            <Plus
              size={15}
            />

            Nuevo cliente
          </button>
        </div>
      </div>


      <article className="customers-table-panel">
        {loading ? (
          <ModuleState
            type="loading"
            title="Cargando clientes"
            description="Consultando clientes registrados."
          />
        ) : error ? (
          <div>
            <ModuleState
              type="error"
              title="No se pudieron cargar los clientes"
              description={
                error
              }
            />

            <div
              className="customers-retry"
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
        ) : filteredCustomers
            .length ===
          0 ? (
          <ModuleState
            type="empty"
            title={
              search
              || statusFilter !==
                "all"
                ? "No encontramos clientes"
                : "Todavía no hay clientes"
            }
            description={
              search
              || statusFilter !==
                "all"
                ? "No existen clientes que coincidan con los filtros."
                : "No existen clientes registrados."
            }
          />
        ) : (
          <>
            <DataTable
              columns={
                columns
              }
              data={
                paginatedCustomers
              }
              getRowKey={(
                customer,
              ) =>
                customer.id
              }
              actions={(
                customer,
              ) => (
                <div className="table-actions">
                  <button
                    type="button"
                    className="icon-button"
                    title="Ver cliente"
                    onClick={() =>
                      setViewingCustomer(
                        customer,
                      )
                    }
                  >
                    <Eye
                      size={15}
                    />
                  </button>


                  <button
                    type="button"
                    className="icon-button"
                    title="Editar cliente"
                    onClick={() =>
                      openEdit(
                        customer,
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
                    title="Desactivar cliente"
                    disabled={
                      customer.status !==
                      "active"
                    }
                    onClick={() =>
                      void handleDeactivate(
                        customer,
                      )
                    }
                  >
                    <UserX
                      size={15}
                    />
                  </button>


                  <button
                    type="button"
                    className="icon-button"
                    title="Historial comercial"
                    onClick={() =>
                      void handleHistory(
                        customer,
                      )
                    }
                  >
                    <History
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
          editingCustomer
            ? "Editar cliente"
            : "Registrar cliente"
        }
        description={
          editingCustomer
            ? "Actualiza la información del cliente."
            : "Registra un nuevo cliente."
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
          onSubmit={
            handleSubmit
          }
        >
          {formError && (
            <ModuleState
              type="error"
              title="No se pudo completar la operación"
              description={
                formError
              }
            />
          )}


          <div className="form-grid">


            <label>
              DNI

              <input
                value={
                  form.document_number
                }
                onChange={(
                  event,
                ) =>
                  updateFormField(
                    "document_number",
                    event
                      .target
                      .value,
                  )
                }
                required
              />
            </label>


            <label>
              Nombres

              <input
                value={
                  form.first_name
                  ?? ""
                }
                onChange={(
                  event,
                ) =>
                  updateFormField(
                    "first_name",
                    event
                      .target
                      .value,
                  )
                }
              />
            </label>


            <label>
              Apellidos

              <input
                value={
                  form.last_name
                  ?? ""
                }
                onChange={(
                  event,
                ) =>
                  updateFormField(
                    "last_name",
                    event
                      .target
                      .value,
                  )
                }
              />
            </label>


            <label>
              Razón social

              <input
                value={
                  form.business_name
                  ?? ""
                }
                onChange={(
                  event,
                ) =>
                  updateFormField(
                    "business_name",
                    event
                      .target
                      .value,
                  )
                }
              />
            </label>


            <label>
              Correo

              <input
                type="email"
                value={
                  form.email
                  ?? ""
                }
                onChange={(
                  event,
                ) =>
                  updateFormField(
                    "email",
                    event
                      .target
                      .value,
                  )
                }
              />
            </label>


            <label>
              Teléfono

              <input
                value={
                  form.phone
                  ?? ""
                }
                onChange={(
                  event,
                ) =>
                  updateFormField(
                    "phone",
                    event
                      .target
                      .value,
                  )
                }
              />
            </label>


            <label>
              Ciudad

              <input
                value={
                  form.city
                  ?? ""
                }
                onChange={(
                  event,
                ) =>
                  updateFormField(
                    "city",
                    event
                      .target
                      .value,
                  )
                }
              />
            </label>


            <label>
              Dirección

              <input
                value={
                  form.address
                  ?? ""
                }
                onChange={(
                  event,
                ) =>
                  updateFormField(
                    "address",
                    event
                      .target
                      .value,
                  )
                }
              />
            </label>


            <label>
              Estado

              <select
                value={
                  form.status
                  ?? "active"
                }
                onChange={(
                  event,
                ) =>
                  updateFormField(
                    "status",
                    event
                      .target
                      .value,
                  )
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
                : editingCustomer
                  ? "Actualizar cliente"
                  : "Guardar cliente"}
            </button>
          </div>
        </form>
      </Modal>


      <Modal
        open={
          Boolean(
            viewingCustomer,
          )
        }
        title="Información del cliente"
        description={
          viewingCustomer
            ? customerName(
                viewingCustomer,
              )
            : ""
        }
        onClose={() =>
          setViewingCustomer(
            null,
          )
        }
      >
        {viewingCustomer && (
          <div className="customer-details">
            <div>
              <span>
                Documento
              </span>

              <strong>
                {viewingCustomer.document_type
                  || "—"}{" "}
                {viewingCustomer.document_number
                  || ""}
              </strong>
            </div>


            <div>
              <span>
                Correo
              </span>

              <strong>
                {viewingCustomer.email
                  || "Sin correo"}
              </strong>
            </div>


            <div>
              <span>
                Teléfono
              </span>

              <strong>
                {viewingCustomer.phone
                  || "Sin teléfono"}
              </strong>
            </div>


            <div>
              <span>
                Ciudad
              </span>

              <strong>
                {viewingCustomer.city
                  || "Sin ciudad"}
              </strong>
            </div>


            <div>
              <span>
                Dirección
              </span>

              <strong>
                {viewingCustomer.address
                  || "Sin dirección"}
              </strong>
            </div>


            <div>
              <span>
                Estado
              </span>

              <strong>
                {statusLabel(
                  viewingCustomer.status,
                )}
              </strong>
            </div>
          </div>
        )}
      </Modal>


      <Modal
        open={
          historyOpen
        }
        title="Historial del cliente"
        description="Ventas registradas para este cliente."
        onClose={() => {
          setHistoryOpen(
            false,
          );

          setHistoryError(
            "",
          );
        }}
      >
        {historyLoading ? (
          <ModuleState
            type="loading"
            title="Cargando historial"
            description="Consultando el historial comercial del cliente."
          />
        ) : historyError ? (
          <ModuleState
            type="error"
            title="No se pudo cargar el historial"
            description={
              historyError
            }
          />
        ) : history.length ===
          0 ? (
          <ModuleState
            type="empty"
            title="Sin historial"
            description="No existen ventas registradas para este cliente."
          />
        ) : (
          <div className="enterprise-table-wrapper">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>
                    Venta
                  </th>

                  <th>
                    Fecha
                  </th>

                  <th>
                    Subtotal
                  </th>

                  <th>
                    Total
                  </th>

                  <th>
                    Estado
                  </th>
                </tr>
              </thead>

              <tbody>
                {history.map(
                  (
                    item,
                  ) => (
                    <tr
                      key={
                        item.sale_id
                      }
                    >
                      <td>
                        {
                          item.sale_number
                        }
                      </td>

                      <td>
                        {dateValue(
                          item.sale_date,
                        )}
                      </td>

                      <td>
                        {currency(
                          item.subtotal,
                        )}
                      </td>

                      <td>
                        <strong>
                          {currency(
                            item.total,
                          )}
                        </strong>
                      </td>

                      <td>
                        {saleStatusLabel(
                          item.status,
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </section>
  );
}
