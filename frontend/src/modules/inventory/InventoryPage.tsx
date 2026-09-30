import {
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  PackageSearch,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";

import DataTable, {
  type DataTableColumn,
} from "../../components/ui/DataTable";

import ModuleState from "../../components/ui/ModuleState";
import Pagination from "../../components/ui/Pagination";
import StatCard from "../../components/ui/StatCard";
import TableToolbar from "../../components/ui/TableToolbar";

import {
  getInventory,
} from "../../services/commercial.service";

import {
  useApiResource,
} from "../../hooks/useApiResource";

import type {
  InventoryItem,
} from "../../types/commercial";


const PAGE_SIZE = 8;


function toNumber(
  value: number | string | null,
) {
  const parsed =
    Number(value ?? 0);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}


function formatQuantity(
  value: number | string | null,
) {
  return new Intl.NumberFormat(
    "es-PE",
    {
      maximumFractionDigits: 2,
    },
  ).format(
    toNumber(value),
  );
}


function getStockLevel(
  item: InventoryItem,
) {
  const stock =
    toNumber(
      item.stock_quantity,
    );

  const minimum =
    toNumber(
      item.minimum_stock,
    );

  if (stock <= 0) {
    return "out";
  }

  if (stock <= minimum) {
    return "low";
  }

  return "normal";
}


function InventoryPage() {
  const {
    data,
    loading,
    error,
    reload,
  } = useApiResource(
    getInventory,
  );


  const [
    search,
    setSearch,
  ] = useState("");

  const [
    page,
    setPage,
  ] = useState(1);


  const inventory =
    data ?? [];


  const filteredInventory =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        if (!query) {
          return inventory;
        }

        return inventory.filter(
          (item) =>
            [
              item.sku,
              item.product_name,
              item.stock_status,
              item.stock_quantity,
              item.minimum_stock,
              item.maximum_stock,
            ].some(
              (value) =>
                String(value ?? "")
                  .toLowerCase()
                  .includes(query),
            ),
        );
      },
      [
        inventory,
        search,
      ],
    );


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredInventory.length /
          PAGE_SIZE,
      ),
    );


  const safePage =
    Math.min(
      page,
      totalPages,
    );


  const paginatedInventory =
    useMemo(
      () => {
        const start =
          (safePage - 1) *
          PAGE_SIZE;

        return filteredInventory.slice(
          start,
          start + PAGE_SIZE,
        );
      },
      [
        filteredInventory,
        safePage,
      ],
    );


  const outOfStock =
    inventory.filter(
      (item) =>
        getStockLevel(item) ===
        "out",
    ).length;


  const lowStock =
    inventory.filter(
      (item) =>
        getStockLevel(item) ===
        "low",
    ).length;


  const normalStock =
    inventory.filter(
      (item) =>
        getStockLevel(item) ===
        "normal",
    ).length;


  const alertCount =
    outOfStock +
    lowStock;


  const healthyPercentage =
    inventory.length > 0
      ? Math.round(
          (
            normalStock /
            inventory.length
          ) * 100,
        )
      : 0;


  const alertPercentage =
    inventory.length > 0
      ? Math.round(
          (
            alertCount /
            inventory.length
          ) * 100,
        )
      : 0;


  const outPercentage =
    inventory.length > 0
      ? Math.round(
          (
            outOfStock /
            inventory.length
          ) * 100,
        )
      : 0;


  const columns:
    DataTableColumn<InventoryItem>[] = [
      {
        key: "product",
        label: "Producto",
        render: (item) => (
          <div className="customer-cell">
            <div className="customer-avatar">
              <PackageSearch
                size={17}
              />
            </div>

            <div>
              <strong>
                {item.product_name}
              </strong>

              <span>
                SKU {item.sku}
              </span>
            </div>
          </div>
        ),
      },

      {
        key: "stock",
        label: "Stock actual",
        render: (item) => {
          const level =
            getStockLevel(item);

          return (
            <div>
              <strong>
                {formatQuantity(
                  item.stock_quantity,
                )}
              </strong>

              <div
                className="table-detail"
                style={{
                  marginTop: 4,
                }}
              >
                {level === "normal" ? (
                  <CheckCircle2
                    size={13}
                  />
                ) : (
                  <AlertTriangle
                    size={13}
                  />
                )}

                Existencias
              </div>
            </div>
          );
        },
      },

      {
        key: "minimum",
        label: "Stock mínimo",
        render: (item) => (
          <span className="table-detail">
            <ShieldAlert
              size={13}
            />

            {formatQuantity(
              item.minimum_stock,
            )}
          </span>
        ),
      },

      {
        key: "maximum",
        label: "Stock máximo",
        render: (item) => (
          <span>
            {item.maximum_stock ===
            null
              ? "No definido"
              : formatQuantity(
                  item.maximum_stock,
                )}
          </span>
        ),
      },

      {
        key: "status",
        label: "Nivel",
        render: (item) => {
          const level =
            getStockLevel(item);

          if (level === "out") {
            return (
              <span className="status-badge inactive">
                Sin stock
              </span>
            );
          }

          if (level === "low") {
            return (
              <span className="status-badge warning">
                Stock bajo
              </span>
            );
          }

          return (
            <span className="status-badge success">
              Disponible
            </span>
          );
        },
      },

      {
        key: "backendStatus",
        label: "Estado API",
        render: (item) => (
          <span>
            {item.stock_status ||
              "Sin estado"}
          </span>
        ),
      },
    ];


  return (
    <section className="module-page">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">
            CONTROL OPERATIVO
          </span>

          <h1>
            Gestión de inventario
          </h1>

          <p>
            Supervisa las existencias
            reales, niveles mínimos,
            máximos y alertas de stock
            registradas en SalesIA
            Enterprise.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
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

          <div className="module-main-icon">
            <Boxes size={27} />
          </div>
        </div>
      </div>


      <div className="stats-grid">
        <StatCard
          title="Productos controlados"
          value={String(
            inventory.length,
          )}
          change="100%"
          caption="registros de inventario"
          icon={Boxes}
        />

        <StatCard
          title="Stock saludable"
          value={String(
            normalStock,
          )}
          change={`${healthyPercentage}%`}
          caption="sobre el mínimo"
          icon={CheckCircle2}
        />

        <StatCard
          title="Stock bajo"
          value={String(
            lowStock,
          )}
          change={`${alertPercentage}%`}
          positive={
            alertCount === 0
          }
          caption="requieren atención"
          icon={AlertTriangle}
        />

        <StatCard
          title="Sin stock"
          value={String(
            outOfStock,
          )}
          change={`${outPercentage}%`}
          positive={
            outOfStock === 0
          }
          caption="existencia agotada"
          icon={ShieldAlert}
        />
      </div>


      {alertCount > 0 && (
        <div
          className="module-development-notice"
          style={{
            marginBottom: 20,
          }}
        >
          <AlertTriangle
            size={20}
          />

          <div>
            <strong>
              Atención de inventario
            </strong>

            <p>
              {alertCount}{" "}
              {alertCount === 1
                ? "producto requiere"
                : "productos requieren"}{" "}
              revisión por encontrarse
              en el mínimo o sin
              existencias.
            </p>
          </div>
        </div>
      )}


      <article className="panel enterprise-data-panel">
        <TableToolbar
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          canCreate={false}
        />


        {loading ? (
          <ModuleState
            type="loading"
            title="Cargando inventario"
            description="Consultando existencias registradas en PostgreSQL."
          />
        ) : error ? (
          <div>
            <ModuleState
              type="error"
              title="No se pudo cargar el inventario"
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
                <RefreshCw
                  size={16}
                />

                Reintentar
              </button>
            </div>
          </div>
        ) : filteredInventory.length ===
          0 ? (
          <ModuleState
            type="empty"
            title={
              search
                ? "No encontramos registros"
                : "Todavía no existe inventario"
            }
            description={
              search
                ? "Prueba con otro SKU, producto o estado."
                : "El inventario aparecerá cuando existan productos registrados."
            }
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={
                paginatedInventory
              }
              getRowKey={(
                item,
              ) =>
                item.inventory_id
              }
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


export default InventoryPage;
