import {
  useMemo,
  useState,
} from "react";

import {
  Building2,
  CheckCircle2,
  Mail,
  Pencil,
  Phone,
  Trash2,
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


interface Customer {
  id: number;
  name: string;
  document: string;
  email: string;
  phone: string;
  address: string;
  status: "Activo" | "Inactivo";
}


const initialCustomers: Customer[] = [
  {
    id: 1,
    name: "Comercial Rivera",
    document: "20601234567",
    email: "ventas@rivera.pe",
    phone: "987 654 321",
    address: "Lima, Perú",
    status: "Activo",
  },
  {
    id: 2,
    name: "Grupo San Martín",
    document: "20607654321",
    email: "contacto@sanmartin.pe",
    phone: "966 221 458",
    address: "Lima, Perú",
    status: "Activo",
  },
  {
    id: 3,
    name: "Distribuidora Norte",
    document: "20505557842",
    email: "ventas@norte.pe",
    phone: "955 843 120",
    address: "Piura, Perú",
    status: "Activo",
  },
  {
    id: 4,
    name: "Inversiones Lima",
    document: "20401124578",
    email: "contacto@inversioneslima.pe",
    phone: "944 118 902",
    address: "Lima, Perú",
    status: "Inactivo",
  },
];


function CommercialPage() {
  const [search, setSearch] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [modalOpen, setModalOpen] =
    useState(false);


  const customers = useMemo(
    () => {
      const query = search
        .toLowerCase()
        .trim();

      if (!query) {
        return initialCustomers;
      }

      return initialCustomers.filter(
        (customer) =>
          [
            customer.name,
            customer.document,
            customer.email,
            customer.phone,
            customer.address,
          ].some(
            (value) =>
              value
                .toLowerCase()
                .includes(query),
          ),
      );
    },
    [search],
  );


  const activeCustomers =
    initialCustomers.filter(
      (customer) =>
        customer.status === "Activo",
    ).length;


  const inactiveCustomers =
    initialCustomers.filter(
      (customer) =>
        customer.status === "Inactivo",
    ).length;


  const columns: DataTableColumn<Customer>[] = [
    {
      key: "customer",
      label: "Cliente",
      render: (customer) => (
        <div className="customer-cell">
          <div className="customer-avatar">
            <Building2 size={17} />
          </div>

          <div>
            <strong>
              {customer.name}
            </strong>

            <span>
              RUC {customer.document}
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
          {customer.email}
        </span>
      ),
    },
    {
      key: "phone",
      label: "Teléfono",
      render: (customer) => (
        <span className="table-detail">
          <Phone size={13} />
          {customer.phone}
        </span>
      ),
    },
    {
      key: "address",
      label: "Ubicación",
      render: (customer) => (
        <span>
          {customer.address}
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
          <button
            type="button"
            title="Editar cliente"
          >
            <Pencil size={15} />
          </button>

          <button
            type="button"
            title="Eliminar cliente"
          >
            <Trash2 size={15} />
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

          <h1>
            Clientes
          </h1>

          <p>
            Administra la información de los
            clientes vinculados a las operaciones
            comerciales de SalesIA Enterprise.
          </p>
        </div>

        <div className="module-main-icon">
          <UsersRound size={27} />
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Clientes registrados"
          value={String(
            initialCustomers.length,
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
          change={`${Math.round(
            (
              activeCustomers /
              initialCustomers.length
            ) * 100,
          )}%`}
          caption="con estado activo"
          icon={CheckCircle2}
        />

        <StatCard
          title="Clientes inactivos"
          value={String(
            inactiveCustomers,
          )}
          change={`${Math.round(
            (
              inactiveCustomers /
              initialCustomers.length
            ) * 100,
          )}%`}
          caption="requieren seguimiento"
          icon={UserX}
        />

        <StatCard
          title="Contactos registrados"
          value={String(
            initialCustomers.filter(
              (customer) =>
                customer.email &&
                customer.phone,
            ).length,
          )}
          change="100%"
          caption="con datos de contacto"
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
          onCreate={() =>
            setModalOpen(true)
          }
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
              getRowKey={(customer) =>
                customer.id
              }
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
        title="Registrar nuevo cliente"
        description="Completa la información principal del cliente."
        onClose={() =>
          setModalOpen(false)
        }
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
              <span>
                Nombre o razón social
              </span>

              <input
                type="text"
                placeholder="Ej. Comercial Rivera"
                required
              />
            </label>

            <label>
              <span>
                Documento
              </span>

              <input
                type="text"
                placeholder="RUC o DNI"
                required
              />
            </label>

            <label>
              <span>
                Correo electrónico
              </span>

              <input
                type="email"
                placeholder="correo@empresa.com"
                required
              />
            </label>

            <label>
              <span>
                Teléfono
              </span>

              <input
                type="text"
                placeholder="999 999 999"
                required
              />
            </label>

            <label className="form-full">
              <span>
                Dirección
              </span>

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
              onClick={() =>
                setModalOpen(false)
              }
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
