import { useMemo, useState } from "react";

import {
  Mail,
  Pencil,
  Phone,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";

import DataTable, {
  type DataTableColumn,
} from "../../components/ui/DataTable";

import Modal from "../../components/ui/Modal";
import ModuleState from "../../components/ui/ModuleState";
import Pagination from "../../components/ui/Pagination";
import TableToolbar from "../../components/ui/TableToolbar";

interface Customer {
  id: number;
  name: string;
  document: string;
  email: string;
  phone: string;
  status: "Activo" | "Inactivo";
}

const initialCustomers: Customer[] = [
  {
    id: 1,
    name: "Comercial Rivera",
    document: "20601234567",
    email: "ventas@rivera.pe",
    phone: "987 654 321",
    status: "Activo",
  },
  {
    id: 2,
    name: "Grupo San Martín",
    document: "20607654321",
    email: "contacto@sanmartin.pe",
    phone: "966 221 458",
    status: "Activo",
  },
  {
    id: 3,
    name: "Distribuidora Norte",
    document: "20505557842",
    email: "ventas@norte.pe",
    phone: "955 843 120",
    status: "Activo",
  },
  {
    id: 4,
    name: "Inversiones Lima",
    document: "20401124578",
    email: "contacto@inversioneslima.pe",
    phone: "944 118 902",
    status: "Inactivo",
  },
];

function CommercialPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const customers = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return initialCustomers;
    }

    return initialCustomers.filter((customer) =>
      [
        customer.name,
        customer.document,
        customer.email,
        customer.phone,
      ].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [search]);

  const columns: DataTableColumn<Customer>[] = [
    {
      key: "customer",
      label: "Cliente",
      render: (customer) => (
        <div className="customer-cell">
          <div className="customer-avatar">
            <UserRound size={17} />
          </div>

          <div>
            <strong>{customer.name}</strong>
            <span>{customer.document}</span>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Correo",
      render: (customer) => (
        <span className="table-detail">
          <Mail size={14} />
          {customer.email}
        </span>
      ),
    },
    {
      key: "phone",
      label: "Teléfono",
      render: (customer) => (
        <span className="table-detail">
          <Phone size={14} />
          {customer.phone}
        </span>
      ),
    },
    {
      key: "status",
      label: "Estado",
      render: (customer) => (
        <span
          className={`status-badge ${
            customer.status === "Activo"
              ? "success"
              : "inactive"
          }`}
        >
          {customer.status}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      render: () => (
        <div className="row-actions">
          <button title="Editar">
            <Pencil size={16} />
          </button>

          <button title="Eliminar">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <section className="module-page">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">
            GESTIÓN COMERCIAL
          </span>

          <h1>Clientes</h1>

          <p>
            Registro, consulta y administración de clientes
            asociados a la operación comercial.
          </p>
        </div>

        <div className="module-main-icon">
          <UsersRound size={27} />
        </div>
      </div>

      <article className="panel enterprise-data-panel">
        <TableToolbar
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          createLabel="Nuevo cliente"
          onCreate={() => setModalOpen(true)}
        />

        {customers.length === 0 ? (
          <ModuleState
            type="empty"
            title="No encontramos clientes"
            description="Prueba con otro término de búsqueda."
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={customers}
              getRowKey={(customer) => customer.id}
            />

            <Pagination
              page={page}
              totalPages={1}
              onPageChange={setPage}
            />
          </>
        )}
      </article>

      <Modal
        open={modalOpen}
        title="Registrar cliente"
        description="Completa los datos principales del cliente."
        onClose={() => setModalOpen(false)}
      >
        <form
          className="enterprise-form"
          onSubmit={(event) => {
            event.preventDefault();
            setModalOpen(false);
          }}
        >
          <div className="form-grid">
            <label>
              <span>Nombre o razón social</span>
              <input
                type="text"
                placeholder="Ej. Comercial Rivera"
              />
            </label>

            <label>
              <span>Documento</span>
              <input
                type="text"
                placeholder="RUC o DNI"
              />
            </label>

            <label>
              <span>Correo electrónico</span>
              <input
                type="email"
                placeholder="correo@empresa.com"
              />
            </label>

            <label>
              <span>Teléfono</span>
              <input
                type="text"
                placeholder="999 999 999"
              />
            </label>

            <label className="form-full">
              <span>Dirección</span>
              <input
                type="text"
                placeholder="Dirección comercial"
              />
            </label>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="primary-button"
            >
              Guardar cliente
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}

export default CommercialPage;
