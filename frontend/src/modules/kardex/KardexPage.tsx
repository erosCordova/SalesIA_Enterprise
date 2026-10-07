import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronLeft,
  ChevronRight,
  PackageSearch,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import ExportActions from "../../components/ui/ExportActions";
import ModuleState from "../../components/ui/ModuleState";

import {
  getInventory,
} from "../../services/commercial.service";

import {
  createInventoryMovement,
  getInventoryMovements,
} from "../../services/inventory.service";

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

import type {
  InventoryMovement,
  InventoryMovementType,
} from "../../types/inventory";

import "./kardex-commercial.css";


const PAGE_SIZE = 10;


type MovementFilter =
  | "all"
  | "entry"
  | "exit";


function toNumber(
  value: number | string,
) {
  const parsed =
    Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}


function formatQuantity(
  value: number | string,
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


function formatDate(
  value: string,
) {
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
      dateStyle: "short",
      timeStyle: "short",
    },
  ).format(date);
}


function normalizeType(
  value: string,
): InventoryMovementType | "other" {
  const normalized =
    value
      .trim()
      .toLowerCase();

  if (
    [
      "entry",
      "in",
      "entrada",
      "initial",
      "initial_stock",
      "purchase",
    ].includes(normalized)
  ) {
    return "entry";
  }

  if (
    [
      "exit",
      "out",
      "salida",
      "sale",
    ].includes(normalized)
  ) {
    return "exit";
  }

  return "other";
}


function typeLabel(
  value: string,
) {
  const normalized =
    normalizeType(value);

  if (normalized === "entry") {
    return "Entrada";
  }

  if (normalized === "exit") {
    return "Salida";
  }

  return value;
}


export default function KardexPage() {
  const exportRef =
    useRef<HTMLElement>(
      null,
    );


  const [
    exportError,
    setExportError,
  ] =
    useState("");


  const [
    movements,
    setMovements,
  ] =
    useState<InventoryMovement[]>(
      [],
    );

  const [
    inventory,
    setInventory,
  ] =
    useState<InventoryItem[]>(
      [],
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );


  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    movementFilter,
    setMovementFilter,
  ] =
    useState<MovementFilter>(
      "all",
    );

  const [
    dateFrom,
    setDateFrom,
  ] =
    useState("");

  const [
    dateTo,
    setDateTo,
  ] =
    useState("");

  const [
    page,
    setPage,
  ] =
    useState(1);


  const [
    formOpen,
    setFormOpen,
  ] =
    useState(false);

  const [
    productId,
    setProductId,
  ] =
    useState("");

  const [
    movementType,
    setMovementType,
  ] =
    useState<InventoryMovementType>(
      "entry",
    );

  const [
    quantity,
    setQuantity,
  ] =
    useState("");

  const [
    reason,
    setReason,
  ] =
    useState("");

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    formMessage,
    setFormMessage,
  ] =
    useState<{
      type: "success" | "error";
      text: string;
    } | null>(
      null,
    );


  const loadData =
    useCallback(
      async () => {
        setLoading(true);
        setError(null);

        try {
          const [
            movementData,
            inventoryData,
          ] =
            await Promise.all([
              getInventoryMovements(),
              getInventory(),
            ]);

          setMovements(
            movementData,
          );

          setInventory(
            inventoryData,
          );
        } catch (
          requestError
        ) {
          setError(
            requestError
              instanceof Error
              ? requestError.message
              : "No se pudo cargar el Kardex.",
          );
        } finally {
          setLoading(false);
        }
      },
      [],
    );


  useEffect(
    () => {
      void loadData();
    },
    [
      loadData,
    ],
  );


  const selectedProduct =
    useMemo(
      () =>
        inventory.find(
          (item) =>
            item.product_id ===
            productId,
        ) ?? null,
      [
        inventory,
        productId,
      ],
    );


  const filteredMovements =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        return movements.filter(
          (movement) => {
            const normalizedType =
              normalizeType(
                movement.movement_type,
              );

            if (
              movementFilter !==
                "all"
              && normalizedType !==
                movementFilter
            ) {
              return false;
            }

            const movementDate =
              movement
                .movement_date
                .slice(
                  0,
                  10,
                );

            if (
              dateFrom
              && movementDate <
                dateFrom
            ) {
              return false;
            }

            if (
              dateTo
              && movementDate >
                dateTo
            ) {
              return false;
            }

            if (!query) {
              return true;
            }

            return [
              movement.sku,
              movement.product_name,
              movement.user_name,
              movement.reason,
              movement.reference_label,
              movement.reference_type,
              movement.movement_type,
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
        movements,
        movementFilter,
        search,
        dateFrom,
        dateTo,
      ],
    );


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredMovements.length /
          PAGE_SIZE,
      ),
    );


  const safePage =
    Math.min(
      page,
      totalPages,
    );


  const startIndex =
    filteredMovements.length === 0
      ? 0
      : (
          safePage - 1
        ) * PAGE_SIZE + 1;


  const endIndex =
    Math.min(
      safePage * PAGE_SIZE,
      filteredMovements.length,
    );


  const displayedMovements =
    filteredMovements.slice(
      (
        safePage - 1
      ) * PAGE_SIZE,

      safePage * PAGE_SIZE,
    );


  function exportRows(): ExportRow[] {
    return filteredMovements.map(
      (movement) => ({
        Fecha:
          formatDate(
            movement.movement_date,
          ),

        SKU:
          movement.sku,

        Producto:
          movement.product_name,

        Tipo:
          typeLabel(
            movement.movement_type,
          ),

        Cantidad:
          toNumber(
            movement.quantity,
          ),

        Referencia:
          movement.reference_label
          || "—",

        Motivo:
          movement.reason
          || "—",

        Usuario:
          movement.user_name
          || "—",
      }),
    );
  }


  function exportFilename() {
    return `kardex-${exportDateStamp()}`;
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
        "Kardex",
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
        "Kardex - SalesIA Enterprise",
        "Historial de movimientos de inventario de SalesIA Enterprise.",
      );
    } catch (
      currentError
    ) {
      setExportError(
        currentError instanceof Error
          ? currentError.message
          : "No se pudo compartir el Kardex.",
      );
    }
  }


  function clearFilters() {
    setSearch("");
    setMovementFilter(
      "all",
    );
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }


  async function handleSubmit(
    event: FormEvent,
  ) {
    event.preventDefault();

    setFormMessage(null);


    if (!productId) {
      setFormMessage({
        type: "error",
        text:
          "Selecciona un producto.",
      });

      return;
    }


    const parsedQuantity =
      Number(quantity);


    if (
      !Number.isFinite(
        parsedQuantity,
      )
      || parsedQuantity <= 0
    ) {
      setFormMessage({
        type: "error",
        text:
          "La cantidad debe ser mayor que cero.",
      });

      return;
    }


    if (
      reason
        .trim()
        .length < 3
    ) {
      setFormMessage({
        type: "error",
        text:
          "Indica el motivo del movimiento.",
      });

      return;
    }


    if (
      movementType === "exit"
      && selectedProduct
      && parsedQuantity >
        toNumber(
          selectedProduct
            .stock_quantity,
        )
    ) {
      setFormMessage({
        type: "error",
        text:
          "La salida supera el stock disponible.",
      });

      return;
    }


    setSaving(true);

    try {
      await createInventoryMovement({
        product_id:
          productId,

        movement_type:
          movementType,

        quantity:
          parsedQuantity,

        reason:
          reason.trim(),
      });


      setProductId("");
      setQuantity("");
      setReason("");

      setFormMessage({
        type: "success",
        text:
          "Movimiento registrado correctamente.",
      });

      await loadData();
    } catch (
      requestError
    ) {
      setFormMessage({
        type: "error",

        text:
          requestError
            instanceof Error
            ? requestError.message
            : "No se pudo registrar el movimiento.",
      });
    } finally {
      setSaving(false);
    }
  }


  return (
    <section
      ref={exportRef}
      className="kardex-page"
    >
      <header className="kardex-header">
        <div>
          <h1>
            Kardex
          </h1>

          <p>
            Historial y registro de movimientos de inventario.
          </p>
        </div>


        <div
          className="kardex-header-actions"
          data-export-hide="true"
        >
          <ExportActions
            disabled={
              loading
              || Boolean(error)
              || filteredMovements.length === 0
            }
            onPdf={handlePdf}
            onCsv={handleCsv}
            onExcel={handleExcel}
            onShare={handleShare}
          />


          <button
            type="button"
            className="kardex-button-secondary"
            disabled={loading}
            onClick={() =>
              void loadData()
            }
          >
            <RefreshCw
              size={15}
              className={
                loading
                  ? "is-spinning"
                  : ""
              }
            />

            Actualizar
          </button>


          <button
            type="button"
            className="kardex-button-primary"
            onClick={() => {
              setFormOpen(
                (value) =>
                  !value,
              );

              setFormMessage(
                null,
              );
            }}
          >
            {formOpen ? (
              <X size={15} />
            ) : (
              <Plus size={15} />
            )}

            {formOpen
              ? "Cerrar"
              : "Registrar movimiento"}
          </button>
        </div>
      </header>


      {formOpen && (
        <form
          className="kardex-form"
          data-export-hide="true"
          onSubmit={
            handleSubmit
          }
        >
          <div className="kardex-form-title">
            Registrar movimiento
          </div>


          <div className="kardex-form-grid">
            <label>
              <span>
                Producto
              </span>

              <select
                value={
                  productId
                }
                onChange={(event) =>
                  setProductId(
                    event.target.value,
                  )
                }
                required
              >
                <option value="">
                  Seleccionar producto
                </option>

                {inventory.map(
                  (item) => (
                    <option
                      key={
                        item.product_id
                      }
                      value={
                        item.product_id
                      }
                    >
                      {item.product_name}
                      {" · "}
                      {item.sku}
                    </option>
                  ),
                )}
              </select>

              {selectedProduct && (
                <small>
                  Stock actual:{" "}
                  {formatQuantity(
                    selectedProduct
                      .stock_quantity,
                  )}
                </small>
              )}
            </label>


            <label>
              <span>
                Tipo
              </span>

              <select
                value={
                  movementType
                }
                onChange={(event) =>
                  setMovementType(
                    event.target.value as InventoryMovementType,
                  )
                }
              >
                <option value="entry">
                  Entrada
                </option>

                <option value="exit">
                  Salida
                </option>
              </select>
            </label>


            <label>
              <span>
                Cantidad
              </span>

              <input
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={(event) =>
                  setQuantity(
                    event.target.value,
                  )
                }
                placeholder="0"
                required
              />
            </label>


            <label className="kardex-reason-field">
              <span>
                Motivo
              </span>

              <input
                type="text"
                value={reason}
                onChange={(event) =>
                  setReason(
                    event.target.value,
                  )
                }
                placeholder={
                  movementType ===
                  "entry"
                    ? "Ej. Reposición de mercadería"
                    : "Ej. Ajuste de inventario"
                }
                required
              />
            </label>
          </div>


          {formMessage && (
            <div
              className={`kardex-form-message ${formMessage.type}`}
            >
              {formMessage.text}
            </div>
          )}


          <div className="kardex-form-actions">
            <button
              type="button"
              className="kardex-button-secondary"
              disabled={saving}
              onClick={() => {
                setFormOpen(false);
                setFormMessage(null);
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="kardex-button-primary"
              disabled={saving}
            >
              {saving
                ? "Registrando..."
                : "Guardar movimiento"}
            </button>
          </div>
        </form>
      )}


      {exportError && (
        <div
          className="kardex-export-error"
          data-export-hide="true"
        >
          {exportError}
        </div>
      )}


      <section className="kardex-panel">
        <div
          className="kardex-toolbar"
          data-export-hide="true"
        >
          <label className="kardex-search">
            <Search size={16} />

            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(
                  event.target.value,
                );
                setPage(1);
              }}
              placeholder="Buscar producto, SKU, usuario o motivo..."
            />
          </label>


          <select
            className="kardex-type-filter"
            value={
              movementFilter
            }
            onChange={(event) => {
              setMovementFilter(
                event.target.value as MovementFilter,
              );
              setPage(1);
            }}
          >
            <option value="all">
              Todos los movimientos
            </option>

            <option value="entry">
              Entradas
            </option>

            <option value="exit">
              Salidas
            </option>
          </select>


          <label className="kardex-date-filter">
            <span>
              Desde
            </span>

            <input
              type="date"
              value={dateFrom}
              onChange={(event) => {
                setDateFrom(
                  event.target.value,
                );
                setPage(1);
              }}
            />
          </label>


          <label className="kardex-date-filter">
            <span>
              Hasta
            </span>

            <input
              type="date"
              value={dateTo}
              onChange={(event) => {
                setDateTo(
                  event.target.value,
                );
                setPage(1);
              }}
            />
          </label>


          <button
            type="button"
            className="kardex-clear-button"
            onClick={
              clearFilters
            }
          >
            Limpiar
          </button>
        </div>


        {loading ? (
          <div className="kardex-state">
            <ModuleState
              type="loading"
              title="Cargando Kardex"
            />
          </div>
        ) : error ? (
          <div className="kardex-state">
            <ModuleState
              type="error"
              title="No se pudo cargar el Kardex"
              description={error}
            />

            <button
              type="button"
              className="kardex-button-secondary"
              onClick={() =>
                void loadData()
              }
            >
              <RefreshCw size={15} />

              Reintentar
            </button>
          </div>
        ) : displayedMovements.length ===
          0 ? (
          <div className="kardex-state">
            <ModuleState
              type="empty"
              title={
                movements.length === 0
                  ? "No hay movimientos registrados"
                  : "No se encontraron movimientos"
              }
            />
          </div>
        ) : (
          <>
            <div className="kardex-table-wrapper">
              <table className="kardex-table">
                <thead>
                  <tr>
                    <th>
                      Fecha
                    </th>

                    <th>
                      Producto
                    </th>

                    <th>
                      Tipo
                    </th>

                    <th>
                      Cantidad
                    </th>

                    <th>
                      Referencia
                    </th>

                    <th>
                      Motivo
                    </th>

                    <th>
                      Usuario
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {displayedMovements.map(
                    (
                      movement,
                    ) => {
                      const normalized =
                        normalizeType(
                          movement
                            .movement_type,
                        );

                      return (
                        <tr
                          key={
                            movement.id
                          }
                        >
                          <td>
                            <span className="kardex-date">
                              {formatDate(
                                movement
                                  .movement_date,
                              )}
                            </span>
                          </td>


                          <td>
                            <div className="kardex-product">
                              <span className="kardex-product-icon">
                                <PackageSearch
                                  size={15}
                                />
                              </span>

                              <span>
                                <strong>
                                  {
                                    movement
                                      .product_name
                                  }
                                </strong>

                                <small>
                                  {
                                    movement
                                      .sku
                                  }
                                </small>
                              </span>
                            </div>
                          </td>


                          <td>
                            <span
                              className={`kardex-type kardex-type-${normalized}`}
                            >
                              {normalized ===
                              "entry" ? (
                                <ArrowDownToLine
                                  size={12}
                                />
                              ) : normalized ===
                                "exit" ? (
                                <ArrowUpFromLine
                                  size={12}
                                />
                              ) : null}

                              {typeLabel(
                                movement
                                  .movement_type,
                              )}
                            </span>
                          </td>


                          <td>
                            <strong className="kardex-quantity">
                              {formatQuantity(
                                movement
                                  .quantity,
                              )}
                            </strong>
                          </td>


                          <td>
                            <span className="kardex-muted">
                              {movement
                                .reference_label
                                || "—"}
                            </span>
                          </td>


                          <td>
                            <span className="kardex-reason">
                              {movement.reason
                                || "—"}
                            </span>
                          </td>


                          <td>
                            <span className="kardex-muted">
                              {movement
                                .user_name
                                || "—"}
                            </span>
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>


            <footer className="kardex-footer">
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
                  {filteredMovements.length}
                </strong>
              </span>


              <div className="kardex-pagination">
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
                  <ChevronLeft
                    size={15}
                  />
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
                  <ChevronRight
                    size={15}
                  />
                </button>
              </div>
            </footer>
          </>
        )}
      </section>
    </section>
  );
}
