import {
  useMemo,
  useState,
} from "react";

import {
  Banknote,
  CheckCircle2,
  Plus,
  ReceiptText,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  UserRound,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import DataTable, {
  type DataTableColumn,
} from "../../components/ui/DataTable";

import ModuleState from "../../components/ui/ModuleState";
import Pagination from "../../components/ui/Pagination";
import StatCard from "../../components/ui/StatCard";
import TableToolbar from "../../components/ui/TableToolbar";

import {
  getSales,
} from "../../services/commercial.service";

import {
  useApiResource,
} from "../../hooks/useApiResource";

import {
  useAuth,
} from "../../services/auth.context";

import type {
  SaleListItem,
} from "../../types/commercial";

import "./ventas.css";


const PAGE_SIZE = 8;


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


function formatDate(
  value: string,
) {
  if (!value) {
    return "Sin fecha";
  }

  const date =
    new Date(value);

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
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}


function VentasPage() {
  const navigate =
    useNavigate();

  const {
    user,
  } = useAuth();


  const {
    data,
    loading,
    error,
    reload,
  } = useApiResource(
    getSales,
  );


  const [
    search,
    setSearch,
  ] = useState("");

  const [
    page,
    setPage,
  ] = useState(1);


  const sales =
    data ?? [];


  const canCreateSale =
    user?.role ===
      "Administrador" ||
    user?.role ===
      "Vendedor";


  const filteredSales =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        if (!query) {
          return sales;
        }

        return sales.filter(
          (sale) =>
            [
              sale.sale_number,
              sale.customer_name,
              sale.status,
              sale.sale_date,
              sale.total,
            ].some(
              (value) =>
                String(value ?? "")
                  .toLowerCase()
                  .includes(query),
            ),
        );
      },
      [
        sales,
        search,
      ],
    );


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredSales.length /
          PAGE_SIZE,
      ),
    );


  const safePage =
    Math.min(
      page,
      totalPages,
    );


  const paginatedSales =
    useMemo(
      () => {
        const start =
          (safePage - 1) *
          PAGE_SIZE;

        return filteredSales.slice(
          start,
          start + PAGE_SIZE,
        );
      },
      [
        filteredSales,
        safePage,
      ],
    );


  const completedSales =
    sales.filter(
      (sale) =>
        sale.status ===
        "completed",
    ).length;


  const revenue =
    sales.reduce(
      (total, sale) =>
        total +
        toNumber(
          sale.total,
        ),
      0,
    );


  const averageTicket =
    sales.length > 0
      ? revenue /
        sales.length
      : 0;


  const completedPercentage =
    sales.length > 0
      ? Math.round(
          (
            completedSales /
            sales.length
          ) * 100,
        )
      : 0;


  const columns:
    DataTableColumn<SaleListItem>[] = [
      {
        key: "sale",
        label: "Venta",
        render: (sale) => (
          <div className="customer-cell">
            <div className="customer-avatar">
              <ReceiptText
                size={17}
              />
            </div>

            <div>
              <strong>
                {sale.sale_number}
              </strong>

              <span>
                {formatDate(
                  sale.sale_date,
                )}
              </span>
            </div>
          </div>
        ),
      },

      {
        key: "customer",
        label: "Cliente",
        render: (sale) => (
          <span className="table-detail">
            <UserRound
              size={13}
            />

            {sale.customer_name ||
              "Cliente general"}
          </span>
        ),
      },

      {
        key: "subtotal",
        label: "Subtotal",
        render: (sale) =>
          formatMoney(
            sale.subtotal,
          ),
      },

      {
        key: "discount",
        label: "Descuento",
        render: (sale) =>
          formatMoney(
            sale.discount,
          ),
      },

      {
        key: "tax",
        label: "Impuesto",
        render: (sale) =>
          formatMoney(
            sale.tax,
          ),
      },

      {
        key: "total",
        label: "Total",
        render: (sale) => (
          <strong>
            {formatMoney(
              sale.total,
            )}
          </strong>
        ),
      },

      {
        key: "status",
        label: "Estado",
        render: (sale) => (
          <span
            className={`status-badge ${
              sale.status ===
              "completed"
                ? "success"
                : "warning"
            }`}
          >
            {sale.status ===
            "completed"
              ? "Completada"
              : sale.status}
          </span>
        ),
      },
    ];


  return (
    <section className="module-page">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">
            OPERACIÓN COMERCIAL
          </span>

          <h1>
            Ventas
          </h1>

          <p>
            Consulta las operaciones
            comerciales registradas en
            SalesIA Enterprise y sus
            importes reales.
          </p>
        </div>

        <div className="sale-toolbar-actions">
          <button
            type="button"
            className="secondary-button"
            disabled={loading}
            onClick={() => {
              void reload();
            }}
          >
            <RefreshCw
              size={16}
            />

            Actualizar
          </button>

          {canCreateSale && (
            <button
              type="button"
              className="primary-button"
              onClick={() =>
                navigate(
                  "/sales/new",
                )
              }
            >
              <Plus size={16} />
              Nueva venta
            </button>
          )}

          <div className="module-main-icon">
            <ShoppingCart
              size={27}
            />
          </div>
        </div>
      </div>


      <div className="stats-grid">
        <StatCard
          title="Ventas registradas"
          value={String(
            sales.length,
          )}
          change="100%"
          caption="operaciones consultadas"
          icon={ShoppingCart}
        />

        <StatCard
          title="Ventas completadas"
          value={String(
            completedSales,
          )}
          change={`${completedPercentage}%`}
          caption="operaciones finalizadas"
          icon={CheckCircle2}
        />

        <StatCard
          title="Ingresos"
          value={formatMoney(
            revenue,
          )}
          change={
            sales.length > 0
              ? "Registrado"
              : "0%"
          }
          caption="valor total consultado"
          icon={Banknote}
        />

        <StatCard
          title="Ticket promedio"
          value={formatMoney(
            averageTicket,
          )}
          change={
            sales.length > 0
              ? "Promedio"
              : "0%"
          }
          caption="por operación"
          icon={TrendingUp}
        />
      </div>


      <article className="panel enterprise-data-panel">
        <TableToolbar
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          canCreate={
            canCreateSale
          }
          createLabel="Nueva venta"
          onCreate={() =>
            navigate(
              "/sales/new",
            )
          }
        />


        {loading ? (
          <ModuleState
            type="loading"
            title="Cargando ventas"
            description="Consultando operaciones comerciales registradas."
          />
        ) : error ? (
          <div>
            <ModuleState
              type="error"
              title="No se pudieron cargar las ventas"
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
        ) : filteredSales.length ===
          0 ? (
          <ModuleState
            type="empty"
            title={
              search
                ? "No encontramos ventas"
                : "Todavía no existen ventas"
            }
            description={
              search
                ? "Prueba con otro número de venta, cliente o estado."
                : canCreateSale
                  ? "Registra la primera operación desde Nueva venta."
                  : "No existen operaciones disponibles para consultar."
            }
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={
                paginatedSales
              }
              getRowKey={(
                sale,
              ) => sale.id}
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
    </section>
  );
}


export default VentasPage;
