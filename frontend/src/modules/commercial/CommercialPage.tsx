import { useMemo, useState, type FormEvent } from "react";
import {
  Building2,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  UserRound,
  UsersRound,
  UserX,
  Pencil,
} from "lucide-react";

import DataTable, { type DataTableColumn } from "../../components/ui/DataTable";

import Modal from "../../components/ui/Modal";
import ModuleState from "../../components/ui/ModuleState";
import Pagination from "../../components/ui/Pagination";
import StatCard from "../../components/ui/StatCard";
import TableToolbar from "../../components/ui/TableToolbar";

import {
  createCustomer,
  getCustomers,
  updateCustomer,
  deleteCustomer,
} from "../../services/commercial.service";

import { useApiResource } from "../../hooks/useApiResource";

import type { Customer, CustomerCreate } from "../../types/commercial";

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

function customerName(customer: Customer) {
  const businessName = customer.business_name?.trim();

  if (businessName) {
    return businessName;
  }

  const personName = [customer.first_name, customer.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return personName || "Cliente sin nombre";
}

function customerLocation(customer: Customer) {
  return (
    [customer.address, customer.city].filter(Boolean).join(" · ") ||
    "Sin ubicación"
  );
}

function CommercialPage() {
  const { data, loading, error, reload } = useApiResource(getCustomers);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState<CustomerCreate>(initialForm);

  const [saving, setSaving] = useState(false);

  const [formError, setFormError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const customers = data ?? [];

  const filteredCustomers = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return customers;
    }

    return customers.filter((customer) => {
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

      return values.some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query),
      );
    });
  }, [customers, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / PAGE_SIZE),
  );

  const safePage = Math.min(page, totalPages);

  const paginatedCustomers = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;

    return filteredCustomers.slice(start, start + PAGE_SIZE);
  }, [filteredCustomers, safePage]);

  const activeCustomers = customers.filter(
    (customer) => customer.status === "active",
  ).length;

  const inactiveCustomers = customers.filter(
    (customer) => customer.status !== "active",
  ).length;

  const customersWithContact = customers.filter((customer) =>
    Boolean(customer.email || customer.phone),
  ).length;

  const activePercentage =
    customers.length > 0
      ? Math.round((activeCustomers / customers.length) * 100)
      : 0;

  const contactPercentage =
    customers.length > 0
      ? Math.round((customersWithContact / customers.length) * 100)
      : 0;

  const columns: DataTableColumn<Customer>[] = [
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
            <strong>{customerName(customer)}</strong>

            <span>
              {customer.document_type ?? "Documento"}{" "}
              {customer.document_number ?? "—"}
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

          {customer.email || "Sin correo"}
        </span>
      ),
    },
    {
      key: "phone",
      label: "Teléfono",
      render: (customer) => (
        <span className="table-detail">
          <Phone size={13} />

          {customer.phone || "Sin teléfono"}
        </span>
      ),
    },
    {
      key: "location",
      label: "Ubicación",
      render: (customer) => (
        <span className="table-detail">
          <MapPin size={13} />

          {customerLocation(customer)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Estado",
      render: (customer) => (
        <span
          className={`status-badge ${
            customer.status === "active" ? "success" : "inactive"
          }`}
        >
          {customer.status === "active" ? "Activo" : "Inactivo"}
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
            onClick={() => handleEdit(customer)}
            title="Editar cliente"
          >
            <Pencil size={15} />
            Editar
          </button>

          <button
            type="button"
            className="secondary-button"
            disabled={customer.status !== "active"}
            onClick={() => void handleDeactivate(customer)}
            title="Desactivar cliente"
          >
            <UserX size={15} />
            Desactivar
          </button>
        </div>
      ),
    },
  ];
  function handleEdit(customer: Customer) {
    setEditingCustomer(customer);
    setForm({
      document_type: customer.document_type ?? "DNI",
      document_number: customer.document_number ?? "",
      business_name: customer.business_name ?? "",
      first_name: customer.first_name ?? null,
      last_name: customer.last_name ?? null,
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      address: customer.address ?? "",
      city: customer.city ?? "",
      status: customer.status === "inactive" ? "inactive" : "active",
    });

    setFormError("");
    setSuccessMessage("");
    setModalOpen(true);
  }

  async function handleDeactivate(customer: Customer) {
    const confirmed = window.confirm(
      `¿Deseas desactivar al cliente "${customerName(customer)}"?`,
    );

    if (!confirmed) return;

    setFormError("");
    setSuccessMessage("");

    try {
      await deleteCustomer(String(customer.id));
      await reload();
      setSuccessMessage("Cliente desactivado correctamente.");
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "No se pudo desactivar el cliente.",
      );
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");
    setSaving(true);

    try {
      const payload: CustomerCreate = {
        ...form,
        document_type: form.document_type.trim(),
        document_number: form.document_number.trim(),
        business_name: form.business_name?.trim() || null,
        first_name: form.first_name?.trim() || null,
        last_name: form.last_name?.trim() || null,
        email: form.email?.trim() || null,
        phone: form.phone?.trim() || null,
        address: form.address?.trim() || null,
        city: form.city?.trim() || null,
      };

      if (editingCustomer) {
        await updateCustomer(String(editingCustomer.id), payload);
      } else {
        await createCustomer(payload);
      }

      setForm(initialForm);
      setEditingCustomer(null);
      setModalOpen(false);
      setPage(1);

      await reload();

      setSuccessMessage(
        editingCustomer
          ? "Cliente actualizado correctamente."
          : "Cliente registrado correctamente.",
      );

      setForm(initialForm);
      setModalOpen(false);
      setPage(1);

      await reload();

      setSuccessMessage("Cliente registrado correctamente.");
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "No se pudo guardar el cliente.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="module-page">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">GESTIÓN COMERCIAL</span>

          <h1>Clientes</h1>

          <p>
            Administra la información real de los clientes vinculados a las
            operaciones comerciales de SalesIA Enterprise.
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
          description={successMessage}
        />
      )}

      <div className="stats-grid">
        <StatCard
          title="Clientes registrados"
          value={String(customers.length)}
          change="100%"
          caption="base comercial actual"
          icon={UsersRound}
        />

        <StatCard
          title="Clientes activos"
          value={String(activeCustomers)}
          change={`${activePercentage}%`}
          caption="con estado activo"
          icon={CheckCircle2}
        />

        <StatCard
          title="Clientes inactivos"
          value={String(inactiveCustomers)}
          change={
            customers.length > 0
              ? `${Math.round((inactiveCustomers / customers.length) * 100)}%`
              : "0%"
          }
          positive={inactiveCustomers === 0}
          caption="requieren seguimiento"
          icon={UserX}
        />

        <StatCard
          title="Con datos de contacto"
          value={String(customersWithContact)}
          change={`${contactPercentage}%`}
          caption="correo o teléfono"
          icon={UserRound}
        />
      </div>

      <article className="panel enterprise-data-panel">
        <TableToolbar
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          createLabel="Nuevo cliente"
          onCreate={() => {
            setEditingCustomer(null);
            setForm(initialForm);
            setFormError("");
            setSuccessMessage("");
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
                padding: "0 20px 20px",
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
        ) : filteredCustomers.length === 0 ? (
          <ModuleState
            type="empty"
            title={
              search ? "No encontramos clientes" : "Todavía no hay clientes"
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
              data={paginatedCustomers}
              getRowKey={(customer) => customer.id}
            />
            <Pagination
              page={safePage}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </article>

      <Modal
        open={modalOpen}
        title={editingCustomer ? "Editar cliente" : "Registrar nuevo cliente"}
        description="La información será almacenada mediante la API de SalesIA Enterprise."
        onClose={() => {
          if (!saving) {
            setModalOpen(false);
            setFormError("");
            setEditingCustomer(null);
          }
        }}
      >
        <form className="enterprise-form" onSubmit={handleSubmit}>
          {formError && (
            <ModuleState
              type="error"
              title="No se pudo registrar"
              description={formError}
            />
          )}

          <div className="form-grid">
            <label>
              <span>Tipo de documento</span>

              <select
                value={form.document_type}
                onChange={(event) =>
                  setForm({
                    ...form,
                    document_type: event.target.value,
                  })
                }
              >
                <option value="RUC">RUC</option>

                <option value="DNI">DNI</option>

                <option value="CE">Carné de extranjería</option>

                <option value="PASAPORTE">Pasaporte</option>
              </select>
            </label>

            <label>
              <span>Número de documento</span>

              <input
                type="text"
                minLength={8}
                maxLength={20}
                value={form.document_number}
                onChange={(event) =>
                  setForm({
                    ...form,
                    document_number: event.target.value,
                  })
                }
                placeholder="Ej. 20601234567"
                required
              />
            </label>

            <label className="form-full">
              <span>Razón social</span>

              <input
                type="text"
                maxLength={200}
                value={form.business_name ?? ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    business_name: event.target.value,
                  })
                }
                placeholder="Ej. Comercial Rivera SAC"
                required={!form.first_name && !form.last_name}
              />
            </label>

            <label>
              <span>Nombres</span>

              <input
                type="text"
                maxLength={100}
                value={form.first_name ?? ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    first_name: event.target.value,
                  })
                }
                placeholder="Opcional para empresa"
              />
            </label>

            <label>
              <span>Apellidos</span>

              <input
                type="text"
                maxLength={100}
                value={form.last_name ?? ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    last_name: event.target.value,
                  })
                }
                placeholder="Opcional para empresa"
              />
            </label>

            <label>
              <span>Correo electrónico</span>

              <input
                type="email"
                maxLength={200}
                value={form.email ?? ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    email: event.target.value,
                  })
                }
                placeholder="correo@empresa.com"
              />
            </label>

            <label>
              <span>Teléfono</span>

              <input
                type="text"
                maxLength={30}
                value={form.phone ?? ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    phone: event.target.value,
                  })
                }
                placeholder="999 999 999"
              />
            </label>

            <label>
              <span>Ciudad</span>

              <label>
                <select
                  value={form.city ?? ""}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      city: event.target.value,
                    })
                  }
                  required
                >
                  <option value="" disabled>
                    Selecciona una ciudad
                  </option>
                  <option value="Lima">Lima</option>
                  <option value="Arequipa">Arequipa</option>
                  <option value="Trujillo">Trujillo</option>
                  <option value="Chiclayo">Chiclayo</option>
                  <option value="Piura">Piura</option>
                  <option value="Cusco">Cusco</option>
                  <option value="Huancayo">Huancayo</option>
                  <option value="Iquitos">Iquitos</option>
                  <option value="Tacna">Tacna</option>
                  <option value="Pucallpa">Pucallpa</option>
                  <option value="Chimbote">Chimbote</option>
                  <option value="Ica">Ica</option>
                  <option value="Cajamarca">Cajamarca</option>
                  <option value="Puno">Puno</option>
                  <option value="Ayacucho">Ayacucho</option>
                  <option value="Tarapoto">Tarapoto</option>
                  <option value="Huaraz">Huaraz</option>
                  <option value="Moquegua">Moquegua</option>
                  <option value="Tumbes">Tumbes</option>
                  <option value="Otro">Otro</option>
                </select>
              </label>
            </label>

            <label>
              <span>Estado</span>

              <select
                value={form.status ?? "active"}
                onChange={(event) =>
                  setForm({
                    ...form,
                    status: event.target.value as "active" | "inactive",
                  })
                }
              >
                <option value="active">Activo</option>

                <option value="inactive">Inactivo</option>
              </select>
            </label>

            <label className="form-full">
              <span>Dirección</span>

              <input
                type="text"
                maxLength={500}
                value={form.address ?? ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    address: event.target.value,
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
                setModalOpen(false);
                setFormError("");
              }}
            >
              Cancelar
            </button>

            <button type="submit" className="primary-button" disabled={saving}>
              {saving
                ? "Guardando..."
                : editingCustomer
                  ? "Guardar cambios"
                  : "Guardar cliente"}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}

export default CommercialPage;
