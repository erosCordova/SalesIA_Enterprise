import {
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Boxes,
  ChevronLeft,
  ChevronRight,
  History,
  RefreshCw,
  Search,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import ExportActions from "../../components/ui/ExportActions";
import ModuleState from "../../components/ui/ModuleState";

import {
  getInventory,
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
  InventoryItem,
} from "../../types/commercial";

import "./inventory.css";


const PAGE_SIZE = 10;


type StockFilter =
  | "all"
  | "ok"
  | "low"
  | "out";


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
      key: "out" as const,
      label: "Agotado",
    };
  }

  if (stock <= minimum) {
    return {
      key: "low" as const,
      label: "Stock bajo",
    };
  }

  return {
    key: "ok" as const,
    label: "Disponible",
  };
}


export default function InventoryPage() {
  const exportRef =
    useRef<HTMLElement>(
      null,
    );


  const [
    exportError,
    setExportError,
  ] =
    useState("");


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
    filter,
    setFilter,
  ] =
    useState<StockFilter>(
      "all",
    );

  const [
    page,
    setPage,
  ] =
    useState(1);


  const inventory =
    data ?? [];


  const filteredInventory =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        return inventory.filter(
          (item) => {
            const state =
              getStockState(
                item,
              );

            const matchesFilter =
              filter === "all"
              || state.key === filter;

            if (!matchesFilter) {
              return false;
            }

            if (!query) {
              return true;
            }

            return [
              item.product_name,
              item.sku,
              state.label,
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
        filter,
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


  const startIndex =
    filteredInventory.length === 0
      ? 0
      : (safePage - 1) *
          PAGE_SIZE + 1;


  const endIndex =
    Math.min(
      safePage * PAGE_SIZE,
      filteredInventory.length,
    );


  const paginatedInventory =
    filteredInventory.slice(
      (safePage - 1) *
        PAGE_SIZE,

      safePage *
        PAGE_SIZE,
    );


  function exportRows(): ExportRow[] {
    return filteredInventory.map(
      (item) => {
        const state =
          getStockState(
            item,
          );


        return {
          SKU:
            item.sku,

          Producto:
            item.product_name,

          "Stock actual":
            toNumber(
              item.stock_quantity,
            ),

          "Stock mínimo":
            toNumber(
              item.minimum_stock,
            ),

          "Stock máximo":
            item.maximum_stock === null
              ? "Sin límite"
              : toNumber(
                  item.maximum_stock,
                ),

          Estado:
            state.label,
        };
      },
    );
  }


  function exportFilename() {
    return `inventario-${exportDateStamp()}`;
  }


  async function handlePdf() {
    if (
      !exportRef.current
    ) {
      return;
    }


    setExportError("");


    try {
      await downloadVisualPdf(
        exportRef.current,
        exportFilename(),
      );
    } catch (
      currentError
    ) {
      setExportError(
        currentError instanceof Error
          ? currentError.message
          : "No se pudo generar el PDF.",
      );
    }
  }


  function handleCsv() {
    setExportError("");


    try {
      exportRowsToCsv(
        exportFilename(),
        exportRows(),
      );
    } catch (
      currentError
    ) {
      setExportError(
        currentError instanceof Error
          ? currentError.message
          : "No se pudo generar el CSV.",
      );
    }
  }


  async function handleExcel() {
    setExportError("");


    try {
      await exportRowsToExcel(
        exportFilename(),
        "Inventario",
        exportRows(),
      );
    } catch (
      currentError
    ) {
      setExportError(
        currentError instanceof Error
          ? currentError.message
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


    setExportError("");


    try {
      const file =
        await createVisualPdfFile(
          exportRef.current,
          exportFilename(),
        );


      await shareFile(
        file,
        "Inventario - SalesIA Enterprise",
        "Estado actual del inventario de SalesIA Enterprise.",
      );
    } catch (
      currentError
    ) {
      setExportError(
        currentError instanceof Error
          ? currentError.message
          : "No se pudo compartir el inventario.",
      );
    }
  }


  function updateSearch(
    value: string,
  ) {
    setSearch(value);
    setPage(1);
  }


  function updateFilter(
    value: StockFilter,
  ) {
    setFilter(value);
    setPage(1);
  }


  return (
    <section
      ref={exportRef}
      className="inventory-page"
    >
      <header className="inventory-header">
        <div>
          <h1>
            Inventario
          </h1>

          <p>
            Consulta existencias y disponibilidad de productos.
          </p>
        </div>


        <div
          className="inventory-header-actions"
          data-export-hide="true"
        >
          <ExportActions
            disabled={
              loading
              || filteredInventory.length === 0
            }
            onPdf={handlePdf}
            onCsv={handleCsv}
            onExcel={handleExcel}
            onShare={handleShare}
          />


          <button
            type="button"
            className="inventory-button-secondary"
            disabled={loading}
            onClick={() =>
              void reload()
            }
          >
            <RefreshCw size={15} />

            Actualizar
          </button>

          <button
            type="button"
            className="inventory-button-primary"
            onClick={() =>
              navigate(
                "/kardex",
              )
            }
          >
            <History size={15} />

            Kardex
          </button>
        </div>
      </header>


      {exportError && (
        <div
          className="inventory-export-error"
          data-export-hide="true"
        >
          {exportError}
        </div>
      )}


      <section className="inventory-panel">
        <div
          className="inventory-toolbar"
          data-export-hide="true"
        >
          <div className="inventory-search">
            <Search size={16} />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                updateSearch(
                  event.target.value,
                )
              }
              placeholder="Buscar producto o SKU..."
            />
          </div>


          <div className="inventory-filter">
            <span>
              Estado
            </span>

            <select
              value={filter}
              onChange={(event) =>
                updateFilter(
                  event.target.value as StockFilter,
                )
              }
            >
              <option value="all">
                Todos
              </option>

              <option value="ok">
                Disponible
              </option>

              <option value="low">
                Stock bajo
              </option>

              <option value="out">
                Agotado
              </option>
            </select>
          </div>
        </div>


        {loading ? (
          <div className="inventory-state">
            <ModuleState
              type="loading"
              title="Cargando inventario"
            />
          </div>
        ) : error ? (
          <div className="inventory-state">
            <ModuleState
              type="error"
              title="No se pudo cargar el inventario"
              description={error}
            />

            <button
              type="button"
              className="inventory-button-secondary"
              onClick={() =>
                void reload()
              }
            >
              <RefreshCw size={15} />

              Reintentar
            </button>
          </div>
        ) : filteredInventory.length ===
          0 ? (
          <div className="inventory-state">
            <ModuleState
              type="empty"
              title="No se encontraron productos"
              description="Prueba con otra búsqueda o cambia el estado."
            />
          </div>
        ) : (
          <>
            <div className="inventory-table-wrapper">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>
                      Producto
                    </th>

                    <th>
                      Stock actual
                    </th>

                    <th>
                      Stock mínimo
                    </th>

                    <th>
                      Stock máximo
                    </th>

                    <th>
                      Estado
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedInventory.map(
                    (item) => {
                      const state =
                        getStockState(
                          item,
                        );

                      return (
                        <tr
                          key={
                            item.inventory_id
                          }
                        >
                          <td>
                            <div className="inventory-product">
                              <div className="inventory-product-icon">
                                <Boxes size={16} />
                              </div>

                              <div>
                                <strong>
                                  {item.product_name}
                                </strong>

                                <span>
                                  {item.sku}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <strong className="inventory-stock">
                              {formatQuantity(
                                item.stock_quantity,
                              )}
                            </strong>
                          </td>

                          <td>
                            {formatQuantity(
                              item.minimum_stock,
                            )}
                          </td>

                          <td>
                            {item.maximum_stock ===
                            null
                              ? "Sin límite"
                              : formatQuantity(
                                  item.maximum_stock,
                                )}
                          </td>

                          <td>
                            <span
                              className={`inventory-status inventory-status-${state.key}`}
                            >
                              <i />

                              {state.label}
                            </span>
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>


            <footer className="inventory-footer">
              <span>
                Mostrando{" "}
                <strong>
                  {startIndex}
                </strong>
                {" - "}
                <strong>
                  {endIndex}
                </strong>
                {" de "}
                <strong>
                  {filteredInventory.length}
                </strong>
              </span>


              <div className="inventory-pagination">
                <button
                  type="button"
                  data-export-hide="true"
                  disabled={
                    safePage <= 1
                  }
                  onClick={() =>
                    setPage(
                      safePage - 1,
                    )
                  }
                >
                  <ChevronLeft size={15} />
                </button>

                <span>
                  Página{" "}
                  <strong>
                    {safePage}
                  </strong>
                  {" de "}
                  <strong>
                    {totalPages}
                  </strong>
                </span>

                <button
                  type="button"
                  data-export-hide="true"
                  disabled={
                    safePage >=
                    totalPages
                  }
                  onClick={() =>
                    setPage(
                      safePage + 1,
                    )
                  }
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </footer>
          </>
        )}
      </section>
    </section>
  );
}
