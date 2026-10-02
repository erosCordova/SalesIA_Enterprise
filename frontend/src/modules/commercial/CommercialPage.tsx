import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  Building2,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  UserRound,
  UsersRound,
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
  createCustomer,
  getCustomerHistory,
  getCustomers,
  updateCustomer,
} from "../../services/commercial.service";

import {
  useApiResource,
} from "../../hooks/useApiResource";

import type {
  Customer,
  CustomerCreate,
  CustomerHistoryItem,
  CustomerUpdate,
} from "../../types/commercial";


const PAGE_SIZE = 8;


const initialForm: CustomerCreate = {
  document_type: "RUC",
  document_number: "",
  business_name: "",
  first_name: null,
  last_name: null,
  email: "",
  phone: "",
  address: "",
  city: "",
  status: "active",
};


function customerName(
  customer: Customer,
) {
  const businessName =
    customer.business_name?.trim();

  if (businessName) {
    return businessName;
  }

  const personName = [
    customer.first_name,
    customer.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return personName || "Cliente sin nombre";
}


function customerLocation(
  customer: Customer,
) {
  return [
    customer.address,
    customer.city,
  ]
    .filter(Boolean)
    .join(" · ") || "Sin ubicación";
}


function CommercialPage() {
  const {
    data,
    loading,
    error,
    reload,
  } = useApiResource(
    getCustomers,
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
  ] = useState<CustomerCreate>(
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
    selectedCustomer,
    setSelectedCustomer,
  ] = useState<Customer | null>(null);

  const [
    viewModalOpen,
    setViewModalOpen,
  ] = useState(false);

  const [
    editModalOpen,
    setEditModalOpen,
  ] = useState(false);

  const [
    historyModalOpen,
    setHistoryModalOpen,
  ] = useState(false);

  const [
    history,
    setHistory,
  ] = useState<CustomerHistoryItem[]>(
    [],
  );

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);


  const customers =
    data ?? [];


  const filteredCustomers =
    useMemo(
      () => {
        const query =
          search
            .toLowerCase()
            .trim();

        if (!query) {
          return customers;
        }

        return customers.filter(
          (customer) => {
            const values = [
              customerName(customer),
              customer.document_type,
              customer.document_number,
              customer.email,
              customer.phone,
              customer.address,
              customer.city,
              customer.status,
            ];

            return values.some(
              (value) =>
                String(value ?? "")
                  .toLowerCase()
                  .includes(query),
            );
          },
        );
      },
      [
        customers,
        search,
      ],
    );


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredCustomers.length /
          PAGE_SIZE,
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
          (safePage - 1) *
          PAGE_SIZE;

        return filteredCustomers.slice(
          start,
          start + PAGE_SIZE,
        );
      },
      [
        filteredCustomers,
        safePage,
      ],
    );


  const activeCustomers =
    customers.filter(
      (customer) =>
        customer.status === "active",
    ).length;


  const inactiveCustomers =
    customers.filter(
      (customer) =>
        customer.status !== "active",
    ).length;


  const customersWithContact =
    customers.filter(
      (customer) =>
        Boolean(
          customer.email ||
          customer.phone,
        ),
    ).length;


  const activePercentage =
    customers.length > 0
      ? Math.round(
          (
            activeCustomers /
            customers.length
          ) * 100,
        )
      : 0;


  const contactPercentage =
    customers.length > 0
      ? Math.round(
          (
            customersWithContact /
            customers.length
          ) * 100,
        )
      : 0;


  const columns:
    DataTableColumn<Customer>[] = [
      {
        key: "customer",
        label: "Cliente",
        render: (customer) => (
          <div className="customer-cell">
            <div className="customer-avatar">
              {customer.business_name ? (
                <Building2 size={17} />
              ) : (
                <UserRound size={17} />
              )}
            </div>

            <div>
              <strong>
                {customerName(
                  customer,
                )}
              </strong>

              <span>
                {customer.document_type ??
                  "Documento"}{" "}
                {customer.document_number ??
                  "—"}
              </span>
            </div>
          </div>
        ),
      },

      {
        key: "email",
        label: "Correo electrónico",
        render: (customer) => (
          <span className="table-detail">
            <Mail size={13} />

            {customer.email ||
              "Sin correo"}
          </span>
        ),
      },

      {
        key: "phone",
        label: "Teléfono",
        render: (customer) => (
          <span className="table-detail">
            <Phone size={13} />

            {customer.phone ||
              "Sin teléfono"}
          </span>
        ),
      },

      {
        key: "location",
        label: "Ubicación",
        render: (customer) => (
          <span className="table-detail">
            <MapPin size={13} />

            {customerLocation(
              customer,
            )}
          </span>
        ),
      },

      {
        key: "status",
        label: "Estado",
        render: (customer) => (
          <span
            className={`status-badge ${
              customer.status ===
              "active"
                ? "success"
                : "inactive"
            }`}
          >
            {customer.status ===
            "active"
              ? "Activo"
              : "Inactivo"}
          </span>
        ),
      },

      {
        key: "actions",
        label: "Acciones",
        render: (customer) => (
          <div className="table-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                handleViewCustomer(
                  customer,
                )
              }
            >
              Ver
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                handleEditCustomer(
                  customer,
                )
              }
            >
              Editar
            </button>

            {customer.status ===
              "active" && (
              <button
                type="button"
                className="secondary-button"
                disabled={
                  actionLoading
                }
                onClick={() =>
                  void handleDeactivateCustomer(
                    customer,
                  )
                }
              >
                Desactivar
              </button>
            )}

            <button
              type="button"
              className="secondary-button"
              disabled={
                actionLoading
              }
              onClick={() =>
                void handleCustomerHistory(
                  customer,
                )
              }
            >
              Historial
            </button>
          </div>
        ),
      },
    ];


  function handleViewCustomer(
    customer: Customer,
  ) {
    setSelectedCustomer(customer);
    setViewModalOpen(true);
  }


  function handleEditCustomer(
    customer: Customer,
  ) {
    setSelectedCustomer(customer);
    setFormError("");
    setEditModalOpen(true);
  }


  async function handleDeactivateCustomer(
    customer: Customer,
  ) {
    setActionLoading(true);
    setFormError("");
    setSuccessMessage("");

    try {
      await updateCustomer(
        customer.id,
        {
          document_type:
            customer.document_type ??
            "",

          document_number:
            customer.document_number ??
            "",

          business_name:
            customer.business_name,

          first_name:
            customer.first_name,

          last_name:
            customer.last_name,

          email:
            customer.email,

          phone:
            customer.phone,

          address:
            customer.address,

          city:
            customer.city,

          status: "inactive",
        },
      );

      await reload();

      setSuccessMessage(
        "Cliente desactivado correctamente.",
      );
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "No se pudo desactivar el cliente.",
      );
    } finally {
      setActionLoading(false);
    }
  }


  async function handleCustomerHistory(
    customer: Customer,
  ) {
    setSelectedCustomer(customer);
    setHistory([]);
    setFormError("");
    setHistoryModalOpen(true);
    setActionLoading(true);

    try {
      const result =
        await getCustomerHistory(
          customer.id,
        );

      setHistory(result);
    } catch (err) {
      setHistory([]);

      setFormError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el historial.",
      );
    } finally {
      setActionLoading(false);
    }
  }


  async function handleEditSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedCustomer) {
      return;
    }

    setFormError("");
    setSuccessMessage("");
    setActionLoading(true);

    const updateData: CustomerUpdate = {
      document_type:
        selectedCustomer.document_type ??
        "",

      document_number:
        selectedCustomer.document_number ??
        "",

      business_name:
        selectedCustomer.business_name,

      first_name:
        selectedCustomer.first_name,

      last_name:
        selectedCustomer.last_name,

      email:
        selectedCustomer.email,

      phone:
        selectedCustomer.phone,

      address:
        selectedCustomer.address,

      city:
        selectedCustomer.city,

  status:
  selectedCustomer.status as
    | "active"
    | "inactive",
    };

    try {
      await updateCustomer(
        selectedCustomer.id,
        updateData,
      );

      setEditModalOpen(false);
      setSelectedCustomer(null);

      await reload();

      setSuccessMessage(
        "Cliente actualizado correctamente.",
      );
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el cliente.",
      );
    } finally {
      setActionLoading(false);
    }
  }


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");
    setSaving(true);

    try {
      await createCustomer({
        ...form,

        document_type:
          form.document_type.trim(),

        document_number:
          form.document_number.trim(),

        business_name:
          form.business_name?.trim() ||
          null,

        first_name:
          form.first_name?.trim() ||
          null,

        last_name:
          form.last_name?.trim() ||
          null,

        email:
          form.email?.trim() ||
          null,

        phone:
          form.phone?.trim() ||
          null,

        address:
          form.address?.trim() ||
          null,

        city:
          form.city?.trim() ||
          null,
      });

      setForm(initialForm);
      setModalOpen(false);
      setPage(1);

      await reload();

      setSuccessMessage(
        "Cliente registrado correctamente.",
      );
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "No se pudo registrar el cliente.",
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
            GESTIÓN COMERCIAL
          </span>

          <h1>
            Clientes
          </h1>

          <p>
            Administra la información
            real de los clientes
            vinculados a las operaciones
            comerciales de SalesIA
            Enterprise.
          </p>
        </div>

        <div className="module-main-icon">
          <UsersRound size={27} />
        </div>
      </div>


      {successMessage && (
        <ModuleState
          type="success"
          title="Cliente registrado"
          description={
            successMessage
          }
        />
      )}


      <div className="stats-grid">
        <StatCard
          title="Clientes registrados"
          value={String(
            customers.length,
          )}
          change="100%"
          caption="base comercial actual"
          icon={UsersRound}
        />

        <StatCard
          title="Clientes activos"
          value={String(
            activeCustomers,
          )}
          change={`${activePercentage}%`}
          caption="con estado activo"
          icon={CheckCircle2}
        />

        <StatCard
          title="Clientes inactivos"
          value={String(
            inactiveCustomers,
          )}
          change={
            customers.length > 0
              ? `${Math.round(
                  (
                    inactiveCustomers /
                    customers.length
                  ) * 100,
                )}%`
              : "0%"
          }
          positive={
            inactiveCustomers === 0
          }
          caption="requieren seguimiento"
          icon={UserX}
        />

        <StatCard
          title="Con datos de contacto"
          value={String(
            customersWithContact,
          )}
          change={`${contactPercentage}%`}
          caption="correo o teléfono"
          icon={UserRound}
        />
      </div>


      <article className="panel enterprise-data-panel">
        <TableToolbar
          search={search}
          onSearchChange={(
            value,
          ) => {
            setSearch(value);
            setPage(1);
          }}
          createLabel="Nuevo cliente"
          onCreate={() => {
            setFormError("");
            setModalOpen(true);
          }}
        />


        {loading ? (
          <ModuleState
            type="loading"
            title="Cargando clientes"
            description="Consultando clientes registrados en PostgreSQL."
          />
        ) : error ? (
          <div>
            <ModuleState
              type="error"
              title="No se pudieron cargar los clientes"
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
        ) : filteredCustomers.length ===
          0 ? (
          <ModuleState
            type="empty"
            title={
              search
                ? "No encontramos clientes"
                : "Todavía no hay clientes"
            }
            description={
              search
                ? "Prueba con otro término de búsqueda."
                : "Registra el primer cliente desde el botón Nuevo cliente."
            }
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={
                paginatedCustomers
              }
              getRowKey={(
                customer,
              ) => customer.id}
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
        title="Registrar nuevo cliente"
        description="La información será almacenada mediante la API de SalesIA Enterprise."
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
            <label>
              <span>
                Tipo de documento
              </span>

              <select
                value={
                  form.document_type
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    document_type:
                      event.target
                        .value,
                  })
                }
              >
                <option value="RUC">
                  RUC
                </option>

                <option value="DNI">
                  DNI
                </option>

                <option value="CE">
                  Carné de extranjería
                </option>

                <option value="PASAPORTE">
                  Pasaporte
                </option>
              </select>
            </label>


            <label>
              <span>
                Número de documento
              </span>

              <input
                type="text"
                minLength={8}
                maxLength={20}
                value={
                  form.document_number
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    document_number:
                      event.target
                        .value,
                  })
                }
                placeholder="Ej. 20601234567"
                required
              />
            </label>


            <label className="form-full">
              <span>
                Razón social
              </span>

              <input
                type="text"
                maxLength={200}
                value={
                  form.business_name ??
                  ""
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    business_name:
                      event.target
                        .value,
                  })
                }
                placeholder="Ej. Comercial Rivera SAC"
                required={
                  !form.first_name &&
                  !form.last_name
                }
              />
            </label>


            <label>
              <span>
                Nombres
              </span>

              <input
                type="text"
                maxLength={100}
                value={
                  form.first_name ??
                  ""
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    first_name:
                      event.target
                        .value,
                  })
                }
                placeholder="Opcional para empresa"
              />
            </label>


            <label>
              <span>
                Apellidos
              </span>

              <input
                type="text"
                maxLength={100}
                value={
                  form.last_name ??
                  ""
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    last_name:
                      event.target
                        .value,
                  })
                }
                placeholder="Opcional para empresa"
              />
            </label>


            <label>
              <span>
                Correo electrónico
              </span>

              <input
                type="email"
                maxLength={200}
                value={
                  form.email ?? ""
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    email:
                      event.target
                        .value,
                  })
                }
                placeholder="correo@empresa.com"
              />
            </label>


            <label>
              <span>
                Teléfono
              </span>

              <input
                type="text"
                maxLength={30}
                value={
                  form.phone ?? ""
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    phone:
                      event.target
                        .value,
                  })
                }
                placeholder="999 999 999"
              />
            </label>


            <label>
              <span>
                Ciudad
              </span>

              <input
                type="text"
                maxLength={100}
                value={
                  form.city ?? ""
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    city:
                      event.target
                        .value,
                  })
                }
                placeholder="Lima"
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


            <label className="form-full">
              <span>
                Dirección
              </span>

              <input
                type="text"
                maxLength={500}
                value={
                  form.address ?? ""
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    address:
                      event.target
                        .value,
                  })
                }
                placeholder="Dirección comercial"
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
                : "Guardar cliente"}
            </button>
          </div>
        </form>
      </Modal>


      <Modal
        open={viewModalOpen}
        title="Información del cliente"
        description="Detalle del cliente seleccionado."
        onClose={() => {
          setViewModalOpen(false);
          setSelectedCustomer(null);
        }}
      >
        {selectedCustomer && (
          <div className="enterprise-form">
            <div className="form-grid">
              <label>
                <span>
                  Cliente
                </span>

                <input
                  type="text"
                  value={customerName(
                    selectedCustomer,
                  )}
                  readOnly
                />
              </label>

              <label>
                <span>
                  Documento
                </span>

                <input
                  type="text"
                  value={`${selectedCustomer.document_type ?? "Documento"} ${selectedCustomer.document_number ?? ""}`}
                  readOnly
                />
              </label>

              <label>
                <span>
                  Correo electrónico
                </span>

                <input
                  type="text"
                  value={
                    selectedCustomer.email ??
                    "Sin correo"
                  }
                  readOnly
                />
              </label>

              <label>
                <span>
                  Teléfono
                </span>

                <input
                  type="text"
                  value={
                    selectedCustomer.phone ??
                    "Sin teléfono"
                  }
                  readOnly
                />
              </label>

              <label>
                <span>
                  Ciudad
                </span>

                <input
                  type="text"
                  value={
                    selectedCustomer.city ??
                    "Sin ciudad"
                  }
                  readOnly
                />
              </label>

              <label>
                <span>
                  Estado
                </span>

                <input
                  type="text"
                  value={
                    selectedCustomer.status ===
                    "active"
                      ? "Activo"
                      : "Inactivo"
                  }
                  readOnly
                />
              </label>

              <label className="form-full">
                <span>
                  Dirección
                </span>

                <input
                  type="text"
                  value={
                    selectedCustomer.address ??
                    "Sin dirección"
                  }
                  readOnly
                />
              </label>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setViewModalOpen(false);
                  setSelectedCustomer(null);
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>


      <Modal
        open={editModalOpen}
        title="Editar cliente"
        description="Actualiza la información del cliente."
        onClose={() => {
          if (!actionLoading) {
            setEditModalOpen(false);
            setSelectedCustomer(null);
            setFormError("");
          }
        }}
      >
        {selectedCustomer && (
          <form
            className="enterprise-form"
            onSubmit={
              handleEditSubmit
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
                  Tipo de documento
                </span>

                <select
                  value={
                    selectedCustomer.document_type ??
                    ""
                  }
                  onChange={(
                    event,
                  ) =>
                    setSelectedCustomer({
                      ...selectedCustomer,
                      document_type:
                        event.target
                          .value,
                    })
                  }
                >
                  <option value="RUC">
                    RUC
                  </option>

                  <option value="DNI">
                    DNI
                  </option>

                  <option value="CE">
                    Carné de extranjería
                  </option>

                  <option value="PASAPORTE">
                    Pasaporte
                  </option>
                </select>
              </label>

              <label>
                <span>
                  Número de documento
                </span>

                <input
                  type="text"
                  value={
                    selectedCustomer.document_number ??
                    ""
                  }
                  onChange={(
                    event,
                  ) =>
                    setSelectedCustomer({
                      ...selectedCustomer,
                      document_number:
                        event.target
                          .value,
                    })
                  }
                  required
                />
              </label>

              <label className="form-full">
                <span>
                  Razón social
                </span>

                <input
                  type="text"
                  value={
                    selectedCustomer.business_name ??
                    ""
                  }
                  onChange={(
                    event,
                  ) =>
                    setSelectedCustomer({
                      ...selectedCustomer,
                      business_name:
                        event.target
                          .value,
                    })
                  }
                />
              </label>

              <label>
                <span>
                  Nombres
                </span>

                <input
                  type="text"
                  value={
                    selectedCustomer.first_name ??
                    ""
                  }
                  onChange={(
                    event,
                  ) =>
                    setSelectedCustomer({
                      ...selectedCustomer,
                      first_name:
                        event.target
                          .value,
                    })
                  }
                />
              </label>

              <label>
                <span>
                  Apellidos
                </span>

                <input
                  type="text"
                  value={
                    selectedCustomer.last_name ??
                    ""
                  }
                  onChange={(
                    event,
                  ) =>
                    setSelectedCustomer({
                      ...selectedCustomer,
                      last_name:
                        event.target
                          .value,
                    })
                  }
                />
              </label>

              <label>
                <span>
                  Correo electrónico
                </span>

                <input
                  type="email"
                  value={
                    selectedCustomer.email ??
                    ""
                  }
                  onChange={(
                    event,
                  ) =>
                    setSelectedCustomer({
                      ...selectedCustomer,
                      email:
                        event.target
                          .value,
                    })
                  }
                />
              </label>

              <label>
                <span>
                  Teléfono
                </span>

                <input
                  type="text"
                  value={
                    selectedCustomer.phone ??
                    ""
                  }
                  onChange={(
                    event,
                  ) =>
                    setSelectedCustomer({
                      ...selectedCustomer,
                      phone:
                        event.target
                          .value,
                    })
                  }
                />
              </label>

              <label>
                <span>
                  Ciudad
                </span>

                <input
                  type="text"
                  value={
                    selectedCustomer.city ??
                    ""
                  }
                  onChange={(
                    event,
                  ) =>
                    setSelectedCustomer({
                      ...selectedCustomer,
                      city:
                        event.target
                          .value,
                    })
                  }
                />
              </label>

              <label>
                <span>
                  Estado
                </span>

                <select
                  value={
                    selectedCustomer.status
                  }
                  onChange={(
                    event,
                  ) =>
                    setSelectedCustomer({
                      ...selectedCustomer,
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

              <label className="form-full">
                <span>
                  Dirección
                </span>

                <input
                  type="text"
                  value={
                    selectedCustomer.address ??
                    ""
                  }
                  onChange={(
                    event,
                  ) =>
                    setSelectedCustomer({
                      ...selectedCustomer,
                      address:
                        event.target
                          .value,
                    })
                  }
                />
              </label>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                disabled={
                  actionLoading
                }
                onClick={() => {
                  setEditModalOpen(
                    false,
                  );
                  setSelectedCustomer(
                    null,
                  );
                  setFormError("");
                }}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={
                  actionLoading
                }
              >
                {actionLoading
                  ? "Guardando..."
                  : "Guardar cambios"}
              </button>
            </div>
          </form>
        )}
      </Modal>


      <Modal
        open={historyModalOpen}
        title="Historial del cliente"
        description={
          selectedCustomer
            ? `Historial de ${customerName(selectedCustomer)}.`
            : "Historial de operaciones."
        }
        onClose={() => {
          if (!actionLoading) {
            setHistoryModalOpen(false);
            setSelectedCustomer(null);
            setHistory([]);
            setFormError("");
          }
        }}
      >
        {actionLoading ? (
          <ModuleState
            type="loading"
            title="Cargando historial"
            description="Consultando el historial del cliente."
          />
        ) : formError ? (
          <ModuleState
            type="error"
            title="No se pudo cargar el historial"
            description={
              formError
            }
          />
        ) : history.length === 0 ? (
          <ModuleState
            type="empty"
            title="Sin historial"
            description="Este cliente todavía no tiene operaciones registradas."
          />
        ) : (
          <div className="enterprise-form">
  <div
  style={{
    overflowX: "auto",
  }}
>
  <table
    style={{
      width: "100%",
      borderCollapse: "collapse",
    }}
  >
    <thead>
      <tr>
        <th>Venta</th>
        <th>Fecha</th>
        <th>Subtotal</th>
        <th>Descuento</th>
        <th>IGV</th>
        <th>Total</th>
       <th
  style={{
    minWidth: "100px",
  }}
>
  Estado
</th>
      </tr>
    </thead>

    <tbody>
      {history.map(
        (item) => (
          <tr
            key={
              item.sale_id
            }
          >
            <td>
              {item.sale_number}
            </td>

            <td>
              {new Date(
                item.sale_date,
              ).toLocaleDateString(
                "es-PE",
              )}
            </td>

            <td>
              S/{" "}
              {Number(
                item.subtotal,
              ).toFixed(2)}
            </td>

            <td>
              S/{" "}
              {Number(
                item.discount,
              ).toFixed(2)}
            </td>

            <td>
              S/{" "}
              {Number(
                item.tax,
              ).toFixed(2)}
            </td>

            <td>
              S/{" "}
              {Number(
                item.total,
              ).toFixed(2)}
            </td>

            <td>
              {item.status ===
              "completed"
                ? "Completada"
                : item.status}
            </td>
          </tr>
        ),
      )}
    </tbody>
  </table>
</div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setHistoryModalOpen(
                    false,
                  );
                  setSelectedCustomer(
                    null,
                  );
                  setHistory([]);
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}


export default CommercialPage;