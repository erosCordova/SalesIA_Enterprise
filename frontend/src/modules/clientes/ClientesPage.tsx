import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  CheckCircle2,
  Eye,
  History,
  Mail,
  MapPin,
  Pencil,
  Phone,
  UserRound,
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
} from "../../types/commercial";


const PAGE_SIZE = 8;


const initialForm: CustomerCreate = {
  document_type: "",
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


function ClientesPage() {
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
    editingCustomer,
    setEditingCustomer,
  ] = useState<Customer | null>(
    null,
  );

  const [
    viewingCustomer,
    setViewingCustomer,
  ] = useState<Customer | null>(
    null,
  );

  const [
    historyOpen,
    setHistoryOpen,
  ] = useState(false);

  const [
    history,
    setHistory,
  ] = useState<CustomerHistoryItem[]>(
    [],
  );

  const [
    historyLoading,
    setHistoryLoading,
  ] = useState(false);

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
          (customer) =>
            [
              customer.first_name,
              customer.last_name,
              customer.business_name,
              customer.document_number,
              customer.email,
              customer.phone,
              customer.city,
            ].some(
              (value) =>
                String(value ?? "")
                  .toLowerCase()
                  .includes(query),
            ),
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
          customer.email?.trim() ||
          customer.phone?.trim(),
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
      fullName ||
      customer.business_name ||
      "Cliente sin nombre"
    );
  }


  const columns:
    DataTableColumn<Customer>[] = [
      {
        key: "customer",
        label: "Cliente",
        render: (customer) => (
          <div className="customer-cell">
            <div className="customer-avatar">
              <UserRound size={17} />
            </div>

            <div>
              <strong>
                {customerName(customer)}
              </strong>

              <span>
                {customer.business_name ||
                  customer.document_type ||
                  "Cliente"}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "document",
        label: "Documento",
        render: (customer) => (
          <span>
            {customer.document_type
              ? `${customer.document_type} - `
              : ""}
            {customer.document_number ||
              "Sin documento"}
          </span>
        ),
      },
      {
        key: "email",
        label: "Correo",
        render: (customer) => (
          <span className="customer-contact">
            <Mail size={15} />
            {customer.email ||
              "Sin correo"}
          </span>
        ),
      },
      {
        key: "phone",
        label: "Teléfono",
        render: (customer) => (
          <span className="customer-contact">
            <Phone size={15} />
            {customer.phone ||
              "Sin teléfono"}
          </span>
        ),
      },
      {
        key: "location",
        label: "Ubicación",
        render: (customer) => (
          <span className="customer-contact">
            <MapPin size={15} />
            {customer.city ||
              customer.address ||
              "Sin ubicación"}
          </span>
        ),
      },
      {
        key: "status",
        label: "Estado",
        render: (customer) => (
          <span
            className={`status-badge ${
              customer.status === "active"
                ? "success"
                : "inactive"
            }`}
          >
            {customer.status === "active"
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
              className="icon-button"
              title="Ver"
              onClick={() => {
                setViewingCustomer(
                  customer,
                );
              }}
            >
              <Eye size={16} />
            </button>

            <button
              type="button"
              className="icon-button"
              title="Editar"
              onClick={() => {
                setEditingCustomer(
                  customer,
                );

                setForm({
                  document_type:
                    customer.document_type ||
                    "",
                  document_number:
                    customer.document_number ||
                    "",
                  first_name:
                    customer.first_name ||
                    "",
                  last_name:
                    customer.last_name ||
                    "",
                  business_name:
                    customer.business_name ||
                    "",
                  email:
                    customer.email ||
                    "",
                  phone:
                    customer.phone ||
                    "",
                  address:
                    customer.address ||
                    "",
                  city:
                    customer.city ||
                    "",
                  status:
                    customer.status ===
                    "active"
                      ? "active"
                      : "inactive",
                });

                setFormError("");
                setModalOpen(true);
              }}
            >
              <Pencil size={16} />
            </button>

            <button
              type="button"
              className="icon-button"
              title="Desactivar"
              disabled={
                customer.status !== "active"
              }
              onClick={() => {
                void handleDeactivate(
                  customer,
                );
              }}
            >
              <UserX size={16} />
            </button>

            <button
              type="button"
              className="icon-button"
              title="Historial"
              onClick={() => {
                void handleHistory(
                  customer,
                );
              }}
            >
              <History size={16} />
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
    setSaving(true);

    try {
      if (editingCustomer) {
        await updateCustomer(
          editingCustomer.id,
          {
            ...form,
            document_type:
              form.document_type.trim(),
            document_number:
              form.document_number.trim(),
            first_name:
              form.first_name?.trim() ||
              null,
            last_name:
              form.last_name?.trim() ||
              null,
            business_name:
              form.business_name?.trim() ||
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
          },
        );

        setSuccessMessage(
          "Cliente actualizado correctamente.",
        );
      } else {
        await createCustomer({
          ...form,
          document_type:
            form.document_type.trim(),
          document_number:
            form.document_number.trim(),
          first_name:
            form.first_name?.trim() ||
            null,
          last_name:
            form.last_name?.trim() ||
            null,
          business_name:
            form.business_name?.trim() ||
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

        setSuccessMessage(
          "Cliente registrado correctamente.",
        );
      }

      setForm(initialForm);
      setEditingCustomer(null);
      setModalOpen(false);
      setPage(1);

      await reload();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar el cliente.",
      );
    } finally {
      setSaving(false);
    }
  }


  async function handleDeactivate(
    customer: Customer,
  ) {
    if (
      customer.status !== "active"
    ) {
      return;
    }

    try {
      await updateCustomer(
        customer.id,
        {
          document_type:
            customer.document_type ||
            "",
          document_number:
            customer.document_number ||
            "",
          first_name:
            customer.first_name,
          last_name:
            customer.last_name,
          business_name:
            customer.business_name,
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

      setSuccessMessage(
        "Cliente desactivado correctamente.",
      );

      await reload();
    } catch (err) {
      setSuccessMessage(
        err instanceof Error
          ? err.message
          : "No se pudo desactivar el cliente.",
      );
    }
  }


  async function handleHistory(
    customer: Customer,
  ) {
    setHistoryOpen(true);
    setHistory([]);
    setHistoryLoading(true);

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
      setHistoryLoading(false);
    }
  }


  function updateFormField(
    field: keyof CustomerCreate,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
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
            Administra la información de
            tus clientes y consulta su
            historial comercial.
          </p>
        </div>

        <div className="module-main-icon">
          <UserRound size={27} />
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
          title="Clientes registrados"
          value={String(
            customers.length,
          )}
          change="100%"
          caption="clientes registrados"
          icon={UserRound}
        />

        <StatCard
          title="Clientes activos"
          value={String(
            activeCustomers,
          )}
          change={`${activePercentage}%`}
          caption="clientes activos"
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
          caption="clientes inactivos"
          icon={UserX}
        />

        <StatCard
          title="Con datos de contacto"
          value={String(
            customersWithContact,
          )}
          change={`${contactPercentage}%`}
          caption="con correo o teléfono"
          icon={Mail}
        />
      </div>


      <article className="panel enterprise-data-panel">
        <TableToolbar
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />


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
                : "No existen clientes registrados."
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
        title={
          editingCustomer
            ? "Editar cliente"
            : "Registrar cliente"
        }
        description="Administra la información del cliente."
        onClose={() => {
          if (!saving) {
            setModalOpen(false);
            setEditingCustomer(null);
            setFormError("");
          }
        }}
      >
        <form
          onSubmit={handleSubmit}
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
              Tipo de documento
              <input
                value={
                  form.document_type
                }
                onChange={(event) =>
                  updateFormField(
                    "document_type",
                    event.target.value,
                  )
                }
                required
              />
            </label>

            <label>
              Número de documento
              <input
                value={
                  form.document_number
                }
                onChange={(event) =>
                  updateFormField(
                    "document_number",
                    event.target.value,
                  )
                }
                required
              />
            </label>

            <label>
              Nombres
              <input
                value={
                  form.first_name ?? ""
                }
                onChange={(event) =>
                  updateFormField(
                    "first_name",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              Apellidos
              <input
                value={
                  form.last_name ?? ""
                }
                onChange={(event) =>
                  updateFormField(
                    "last_name",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              Razón social
              <input
                value={
                  form.business_name ?? ""
                }
                onChange={(event) =>
                  updateFormField(
                    "business_name",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              Correo
              <input
                type="email"
                value={
                  form.email ?? ""
                }
                onChange={(event) =>
                  updateFormField(
                    "email",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              Teléfono
              <input
                value={
                  form.phone ?? ""
                }
                onChange={(event) =>
                  updateFormField(
                    "phone",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              Ciudad
              <input
                value={
                  form.city ?? ""
                }
                onChange={(event) =>
                  updateFormField(
                    "city",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              Dirección
              <input
                value={
                  form.address ?? ""
                }
                onChange={(event) =>
                  updateFormField(
                    "address",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              Estado
              <select
                value={
                  form.status ??
                  "active"
                }
                onChange={(event) =>
                  updateFormField(
                    "status",
                    event.target.value,
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
              disabled={saving}
              onClick={() => {
                setModalOpen(false);
                setEditingCustomer(null);
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
                : editingCustomer
                  ? "Actualizar cliente"
                  : "Guardar cliente"}
            </button>
          </div>
        </form>
      </Modal>


      <Modal
        open={Boolean(
          viewingCustomer,
        )}
        title="Información del cliente"
        description={
          viewingCustomer
            ? customerName(
                viewingCustomer,
              )
            : ""
        }
        onClose={() =>
          setViewingCustomer(null)
        }
      >
        {viewingCustomer && (
          <div className="form-grid">
            <div>
              <strong>
                Documento
              </strong>
              <p>
                {viewingCustomer.document_type ||
                  ""}{" "}
                {viewingCustomer.document_number ||
                  "Sin documento"}
              </p>
            </div>

            <div>
              <strong>
                Correo
              </strong>
              <p>
                {viewingCustomer.email ||
                  "Sin correo"}
              </p>
            </div>

            <div>
              <strong>
                Teléfono
              </strong>
              <p>
                {viewingCustomer.phone ||
                  "Sin teléfono"}
              </p>
            </div>

            <div>
              <strong>
                Ciudad
              </strong>
              <p>
                {viewingCustomer.city ||
                  "Sin ciudad"}
              </p>
            </div>

            <div>
              <strong>
                Dirección
              </strong>
              <p>
                {viewingCustomer.address ||
                  "Sin dirección"}
              </p>
            </div>

            <div>
              <strong>
                Estado
              </strong>
              <p>
                {viewingCustomer.status ===
                "active"
                  ? "Activo"
                  : "Inactivo"}
              </p>
            </div>
          </div>
        )}
      </Modal>


      <Modal
        open={historyOpen}
        title="Historial del cliente"
        description="Ventas registradas para este cliente."
        onClose={() => {
          setHistoryOpen(false);
          setFormError("");
        }}
      >
        {historyLoading ? (
          <ModuleState
            type="loading"
            title="Cargando historial"
            description="Consultando el historial comercial del cliente."
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
                  <th>Venta</th>
                  <th>Fecha</th>
                  <th>Subtotal</th>
                  <th>Total</th>
                  <th>Estado</th>
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
                        {
                          item.sale_number
                        }
                      </td>

                      <td>
                        {new Date(
                          item.sale_date,
                        ).toLocaleDateString()}
                      </td>

                      <td>
                        {
                          item.subtotal
                        }
                      </td>

                      <td>
                        {
                          item.total
                        }
                      </td>

                      <td>
                        {
                          item.status
                        }
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


export default ClientesPage;