import {
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  Boxes,
  History,
  PackageCheck,
  PackageX,
  RefreshCw,
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
  getInventory,
} from "../../services/commercial.service";

import {
  useApiResource,
} from "../../hooks/useApiResource";

import type {
  InventoryItem,
} from "../../types/commercial";

import "./inventory.css";


const PAGE_SIZE = 10;


function toNumber(
  value: number | string | null,
) {
  const parsed = Number(value ?? 0);

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


function getStockState(
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
    return {
      key: "out",
      label: "Agotado",
    };
  }

  if (stock <= minimum) {
    return {
      key: "low",
      label: "Stock bajo",
    };
  }

  return {
    key: "ok",
    label: "Disponible",
  };
}


function InventoryPage() {
  const navigate =
    useNavigate();

  const {
    data,
    loading,
    error,
    reload,
  } =
    useApiResource(
      getInventory,
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    page,
    setPage,
  ] =
    useState(1);


  const inventory =
    data ?? [];


  const totalUnits =
    inventory.reduce(
      (total, item) =>
        total +
        toNumber(
          item.stock_quantity,
        ),
      0,
    );


  const outOfStock =
    inventory.filter(
      (item) =>
        toNumber(
          item.stock_quantity,
        ) <= 0,
    ).length;


  const lowStock =
    inventory.filter(
      (item) => {
        const stock =
          toNumber(
            item.stock_quantity,
          );

        const minimum =
          toNumber(
            item.minimum_stock,
          );

        return (
          stock > 0 &&
          stock <= minimum
        );
      },
    ).length;


  const healthyStock =
    inventory.length -
    outOfStock -
    lowStock;


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
          (item) => {
            const state =
              getStockState(
                item,
              );

            return [
              item.sku,
              item.product_name,
              state.label,
              item.stock_quantity,
              item.minimum_stock,
              item.maximum_stock,
            ].some(
              (value) =>
                String(
                  value ?? "",
                )
                  .toLowerCase()
                  .includes(
                    query,
                  ),
            );
          },
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
    filteredInventory.slice(
      (safePage - 1) *
        PAGE_SIZE,

      safePage *
        PAGE_SIZE,
    );


  const columns:
    DataTableColumn<InventoryItem>[] = [
      {
        key: "product",
        label: "Producto",

        render: (item) => (
          <div className="inventory-product-cell">
            <div className="inventory-product-icon">
              <Boxes size={17} />
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

        render: (item) => (
          <strong className="inventory-stock-value">
            {formatQuantity(
              item.stock_quantity,
            )}
          </strong>
        ),
      },

      {
        key: "minimum",
        label: "Stock mínimo",

        render: (item) =>
          formatQuantity(
            item.minimum_stock,
          ),
      },

      {
        key: "maximum",
        label: "Stock máximo",

        render: (item) =>
          item.maximum_stock === null
            ? "Sin límite"
            : formatQuantity(
                item.maximum_stock,
              ),
      },

      {
        key: "availability",
        label: "Disponibilidad",

        render: (item) => {
          const state =
            getStockState(
              item,
            );

          return (
            <span
              className={`inventory-status inventory-status-${state.key}`}
            >
              {state.label}
            </span>
          );
        },
      },
    ];


  return (
    <section className="module-page inventory-page">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">
            CONTROL OPERATIVO
          </span>

          <h1>
            Inventario
          </h1>

          <p>
            Consulta existencias reales,
            identifica productos críticos
            y accede al Kardex para registrar
            cualquier movimiento de stock.
          </p>
        </div>

        <div className="inventory-heading-actions">
          <button
            type="button"
            className="secondary-button"
            disabled={loading}
            onClick={() =>
              void reload()
            }
          >
            <RefreshCw size={16} />

            Actualizar
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={() =>
              navigate(
                "/kardex",
              )
            }
          >
            <History size={16} />

            Abrir Kardex
          </button>
        </div>
      </div>


      <div className="inventory-guidance">
        <div className="inventory-guidance-icon">
          <History size={20} />
        </div>

        <div>
          <strong>
            El stock no se modifica directamente.
          </strong>

          <p>
            Las entradas, salidas, devoluciones y
            ajustes deben registrarse en Kardex
            para conservar la trazabilidad de cada
            movimiento.
          </p>
        </div>
      </div>


      <div className="stats-grid">
        <StatCard
          title="Productos"
          value={String(
            inventory.length,
          )}
          caption="productos con inventario"
          icon={Boxes}
        />

        <StatCard
          title="Unidades disponibles"
          value={formatQuantity(
            totalUnits,
          )}
          caption="existencias acumuladas"
          icon={PackageCheck}
        />

        <StatCard
          title="Stock bajo"
          value={String(
            lowStock,
          )}
          caption="requieren reposición"
          icon={AlertTriangle}
        />

        <StatCard
          title="Agotados"
          value={String(
            outOfStock,
          )}
          caption="sin existencias"
          icon={PackageX}
        />
      </div>


      <div className="inventory-health-panel">
        <div>
          <span>
            ESTADO DEL INVENTARIO
          </span>

          <strong>
            {healthyStock} producto
            {healthyStock === 1
              ? ""
              : "s"}{" "}
            con disponibilidad normal
          </strong>
        </div>

        <div className="inventory-health-summary">
          <div>
            <span className="inventory-dot inventory-dot-ok" />

            Normal

            <strong>
              {healthyStock}
            </strong>
          </div>

          <div>
            <span className="inventory-dot inventory-dot-low" />

            Bajo

            <strong>
              {lowStock}
            </strong>
          </div>

          <div>
            <span className="inventory-dot inventory-dot-out" />

            Agotado

            <strong>
              {outOfStock}
            </strong>
          </div>
        </div>
      </div>


      <article className="panel enterprise-data-panel">
        <TableToolbar
          search={search}
          placeholder="Buscar por producto, SKU o estado..."
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
            description="Consultando las existencias actuales."
          />
        ) : error ? (
          <div>
            <ModuleState
              type="error"
              title="No se pudo cargar el inventario"
              description={error}
            />

            <div className="inventory-retry">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  void reload()
                }
              >
                <RefreshCw size={16} />

                Reintentar
              </button>
            </div>
          </div>
        ) : filteredInventory.length === 0 ? (
          <ModuleState
            type="empty"
            title={
              search
                ? "No encontramos productos"
                : "Inventario vacío"
            }
            description={
              search
                ? "Prueba con otro producto, SKU o estado."
                : "Los productos con inventario aparecerán aquí."
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
