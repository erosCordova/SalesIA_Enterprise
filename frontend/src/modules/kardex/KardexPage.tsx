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
  Box,
  Boxes,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Filter,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
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


const PAGE_SIZE = 12;


type MovementFilter =
  | "all"
  | "entry"
  | "exit";


function toNumber(
  value: number | string,
) {
  const parsed = Number(value);

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
  const date = new Date(value);

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
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  ).format(date);
}


function formatTime(
  value: string,
) {
  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "es-PE",
    {
      hour: "2-digit",
      minute: "2-digit",
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

  return value
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}


function referenceTypeLabel(
  value: string | null,
) {
  if (!value) {
    return "Sin referencia";
  }

  const normalized =
    value
      .trim()
      .toLowerCase();

  const labels:
    Record<string, string> = {
      sale: "Venta",
      purchase: "Compra",
      manual: "Movimiento manual",
      initial_stock: "Stock inicial",
      initial: "Stock inicial",
      sale_cancellation:
        "Anulación de venta",
      adjustment:
        "Ajuste de inventario",
    };

  return (
    labels[normalized]
    ?? normalized
      .replaceAll("_", " ")
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase(),
      )
  );
}


function stockStatusLabel(
  value: string,
) {
  const normalized =
    value
      .trim()
      .toLowerCase();

  if (
    [
      "ok",
      "normal",
      "available",
      "disponible",
    ].includes(normalized)
  ) {
    return "Disponible";
  }

  if (
    [
      "low",
      "low_stock",
      "minimum",
      "bajo",
    ].includes(normalized)
  ) {
    return "Stock bajo";
  }

  if (
    [
      "out",
      "out_of_stock",
      "agotado",
      "empty",
    ].includes(normalized)
  ) {
    return "Agotado";
  }

  return value
    .replaceAll("_", " ");
}


function stockStatusClass(
  value: string,
) {
  const normalized =
    value
      .trim()
      .toLowerCase();

  if (
    normalized.includes("out")
    || normalized.includes("agot")
    || normalized === "empty"
  ) {
    return "out";
  }

  if (
    normalized.includes("low")
    || normalized.includes("bajo")
    || normalized.includes("minimum")
  ) {
    return "low";
  }

  return "ok";
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
    useState<
      InventoryMovement[]
    >([]);

  const [
    inventory,
    setInventory,
  ] =
    useState<
      InventoryItem[]
    >([]);

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
    selectedProductId,
    setSelectedProductId,
  ] =
    useState("");

  const [
    productSearch,
    setProductSearch,
  ] =
    useState("");

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
    referenceFilter,
    setReferenceFilter,
  ] =
    useState("all");

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
    useState<
      InventoryMovementType
    >("entry");

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
      type:
        | "success"
        | "error";
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

          setSelectedProductId(
            (current) => {
              if (
                current
                && inventoryData.some(
                  (item) =>
                    item.product_id
                    === current,
                )
              ) {
                return current;
              }

              return (
                inventoryData[0]
                  ?.product_id
                ?? ""
              );
            },
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
            selectedProductId,
        ) ?? null,
      [
        inventory,
        selectedProductId,
      ],
    );


  const formSelectedProduct =
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


  const visibleProducts =
    useMemo(
      () => {
        const query =
          productSearch
            .trim()
            .toLowerCase();

        return inventory
          .filter(
            (item) => {
              if (!query) {
                return true;
              }

              return (
                item.product_name
                  .toLowerCase()
                  .includes(query)
                || item.sku
                  .toLowerCase()
                  .includes(query)
              );
            },
          )
          .sort(
            (a, b) =>
              a.product_name
                .localeCompare(
                  b.product_name,
                  "es",
                ),
          );
      },
      [
        inventory,
        productSearch,
      ],
    );


  const referenceOptions =
    useMemo(
      () =>
        Array.from(
          new Set(
            movements
              .map(
                (movement) =>
                  movement
                    .reference_type,
              )
              .filter(
                (
                  value,
                ): value is string =>
                  Boolean(value),
              ),
          ),
        ).sort(),
      [
        movements,
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
            if (
              selectedProductId
              && movement.product_id
                !== selectedProductId
            ) {
              return false;
            }

            const normalizedType =
              normalizeType(
                movement.movement_type,
              );

            if (
              movementFilter
                !== "all"
              && normalizedType
                !== movementFilter
            ) {
              return false;
            }

            if (
              referenceFilter
                !== "all"
              && (
                movement
                  .reference_type
                ?? ""
              ) !==
                referenceFilter
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
              && movementDate
                < dateFrom
            ) {
              return false;
            }

            if (
              dateTo
              && movementDate
                > dateTo
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
                  .includes(query),
            );
          },
        );
      },
      [
        movements,
        selectedProductId,
        movementFilter,
        referenceFilter,
        search,
        dateFrom,
        dateTo,
      ],
    );


  const movementSummary =
    useMemo(
      () =>
        filteredMovements.reduce(
          (
            summary,
            movement,
          ) => {
            const type =
              normalizeType(
                movement
                  .movement_type,
              );

            const amount =
              toNumber(
                movement.quantity,
              );

            summary.total += 1;

            if (
              type === "entry"
            ) {
              summary.entryCount += 1;
              summary.entryQuantity +=
                amount;
            }

            if (
              type === "exit"
            ) {
              summary.exitCount += 1;
              summary.exitQuantity +=
                amount;
            }

            return summary;
          },
          {
            total: 0,
            entryCount: 0,
            exitCount: 0,
            entryQuantity: 0,
            exitQuantity: 0,
          },
        ),
      [
        filteredMovements,
      ],
    );


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredMovements.length
        / PAGE_SIZE,
      ),
    );


  const safePage =
    Math.min(
      page,
      totalPages,
    );


  const startOffset =
    (
      safePage - 1
    ) * PAGE_SIZE;


  const displayedMovements =
    filteredMovements.slice(
      startOffset,
      startOffset
      + PAGE_SIZE,
    );


  const startIndex =
    filteredMovements.length === 0
      ? 0
      : startOffset + 1;


  const endIndex =
    Math.min(
      startOffset
      + PAGE_SIZE,
      filteredMovements.length,
    );


  function exportRows():
    ExportRow[] {
    return filteredMovements.map(
      (
        movement,
        index,
      ) => {
        const normalized =
          normalizeType(
            movement
              .movement_type,
          );

        return {
          "#":
            index + 1,

          Fecha:
            formatDate(
              movement
                .movement_date,
            ),

          Hora:
            formatTime(
              movement
                .movement_date,
            ),

          SKU:
            movement.sku,

          Producto:
            movement
              .product_name,

          Operación:
            typeLabel(
              movement
                .movement_type,
            ),

          Motivo:
            movement.reason
            || "—",

          Referencia:
            movement
              .reference_label
            || "—",

          "Tipo de referencia":
            referenceTypeLabel(
              movement
                .reference_type,
            ),

          Ingreso:
            normalized ===
              "entry"
              ? toNumber(
                  movement.quantity,
                )
              : 0,

          Salida:
            normalized ===
              "exit"
              ? toNumber(
                  movement.quantity,
                )
              : 0,

          Usuario:
            movement
              .user_name
            || "—",
        };
      },
    );
  }


  function exportFilename() {
    const productPart =
      selectedProduct
        ?.sku
        ?.toLowerCase()
        ?? "general";

    return (
      `kardex-${productPart}-`
      + exportDateStamp()
    );
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
        currentError
          instanceof Error
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
        currentError
          instanceof Error
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
        currentError
          instanceof Error
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
        "Consulta de movimientos de inventario de SalesIA Enterprise.",
      );
    } catch (
      currentError
    ) {
      setExportError(
        currentError
          instanceof Error
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
    setReferenceFilter(
      "all",
    );
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }


  function selectProduct(
    id: string,
  ) {
    setSelectedProductId(
      id,
    );

    setPage(1);
  }


  function openMovementForm() {
    setFormMessage(null);

    setProductId(
      selectedProductId,
    );

    setFormOpen(true);
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
      && formSelectedProduct
      && parsedQuantity >
        toNumber(
          formSelectedProduct
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

      setQuantity("");
      setReason("");

      setSelectedProductId(
        productId,
      );

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
          <span className="kardex-eyebrow">
            Inventario
          </span>

          <h1>
            Movimiento de Kardex
          </h1>

          <p>
            Consulta la trazabilidad
            real de entradas y salidas
            de cada producto.
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
              || filteredMovements
                .length === 0
            }
            onPdf={handlePdf}
            onCsv={handleCsv}
            onExcel={
              handleExcel
            }
            onShare={
              handleShare
            }
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
              if (formOpen) {
                setFormOpen(
                  false,
                );

                setFormMessage(
                  null,
                );

                return;
              }

              openMovementForm();
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
          <div className="kardex-form-heading">
            <div className="kardex-form-heading-icon">
              <ClipboardList
                size={19}
              />
            </div>

            <div>
              <strong>
                Registrar movimiento
              </strong>

              <span>
                Entrada o salida manual
                de inventario.
              </span>
            </div>
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
                    event
                      .target
                      .value,
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
                        item
                          .product_id
                      }
                      value={
                        item
                          .product_id
                      }
                    >
                      {
                        item
                          .product_name
                      }
                      {" · "}
                      {item.sku}
                    </option>
                  ),
                )}
              </select>

              {formSelectedProduct && (
                <small>
                  Stock disponible:{" "}
                  {formatQuantity(
                    formSelectedProduct
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
                    event
                      .target
                      .value as InventoryMovementType,
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
                    event
                      .target
                      .value,
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
                    event
                      .target
                      .value,
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
              className={
                `kardex-form-message ${
                  formMessage.type
                }`
              }
            >
              {
                formMessage
                  .text
              }
            </div>
          )}

          <div className="kardex-form-actions">
            <button
              type="button"
              className="kardex-button-secondary"
              disabled={saving}
              onClick={() => {
                setFormOpen(
                  false,
                );

                setFormMessage(
                  null,
                );
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


      {loading ? (
        <div className="kardex-main-state">
          <ModuleState
            type="loading"
            title="Cargando Kardex"
            description="Consultando inventario y movimientos."
          />
        </div>
      ) : error ? (
        <div className="kardex-main-state">
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
            <RefreshCw
              size={15}
            />

            Reintentar
          </button>
        </div>
      ) : (
        <div className="kardex-layout">
          <main className="kardex-main-column">
            <section className="kardex-product-summary">
              <div className="kardex-product-summary-main">
                <div className="kardex-product-summary-icon">
                  {selectedProduct
                    ?.image_url ? (
                    <img
                      className="kardex-product-summary-photo"
                      src={
                        selectedProduct
                          .image_url
                      }
                      alt={
                        selectedProduct
                          .product_name
                      }
                    />
                  ) : (
                    <Box
                      size={30}
                    />
                  )}
                </div>

                <div className="kardex-product-summary-title">
                  <span>
                    Resumen del producto
                  </span>

                  <strong>
                    {selectedProduct
                      ?.product_name
                      ?? "Sin producto seleccionado"}
                  </strong>

                  <small>
                    {selectedProduct
                      ? `Código: ${selectedProduct.sku}`
                      : "Selecciona un producto del listado"}
                  </small>
                </div>
              </div>

              <div className="kardex-product-meta">
                <div>
                  <span>
                    Código
                  </span>

                  <strong>
                    {selectedProduct
                      ?.sku
                      ?? "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    Stock mínimo
                  </span>

                  <strong>
                    {selectedProduct
                      ? formatQuantity(
                          selectedProduct
                            .minimum_stock,
                        )
                      : "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    Stock máximo
                  </span>

                  <strong>
                    {selectedProduct
                      ?.maximum_stock
                      !== null
                      && selectedProduct
                        ?.maximum_stock
                        !== undefined
                      ? formatQuantity(
                          selectedProduct
                            .maximum_stock,
                        )
                      : "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    Estado
                  </span>

                  {selectedProduct ? (
                    <strong
                      className={
                        `kardex-stock-status ${
                          stockStatusClass(
                            selectedProduct
                              .stock_status,
                          )
                        }`
                      }
                    >
                      {stockStatusLabel(
                        selectedProduct
                          .stock_status,
                      )}
                    </strong>
                  ) : (
                    <strong>
                      —
                    </strong>
                  )}
                </div>
              </div>

              <div className="kardex-current-stock">
                <div className="kardex-current-stock-label">
                  <Boxes size={20} />

                  <span>
                    Stock actual
                  </span>
                </div>

                <strong>
                  {selectedProduct
                    ? formatQuantity(
                        selectedProduct
                          .stock_quantity,
                      )
                    : "0"}
                </strong>

                <small>
                  unidades
                </small>
              </div>
            </section>


            <section className="kardex-movements-card">
              <header className="kardex-card-header">
                <div className="kardex-card-title">
                  <div className="kardex-card-title-icon">
                    <ClipboardList
                      size={19}
                    />
                  </div>

                  <div>
                    <h2>
                      Movimientos del producto
                    </h2>

                    <p>
                      {
                        filteredMovements
                          .length
                      }{" "}
                      movimientos encontrados
                    </p>
                  </div>
                </div>

                <label
                  className="kardex-table-search"
                  data-export-hide="true"
                >
                  <Search
                    size={15}
                  />

                  <input
                    type="search"
                    value={search}
                    onChange={(event) => {
                      setSearch(
                        event
                          .target
                          .value,
                      );

                      setPage(1);
                    }}
                    placeholder="Buscar en movimientos..."
                  />
                </label>
              </header>


              {displayedMovements
                .length === 0 ? (
                <div className="kardex-empty-table">
                  <ModuleState
                    type="empty"
                    title={
                      movements
                        .length === 0
                        ? "No hay movimientos registrados"
                        : "No se encontraron movimientos"
                    }
                    description="Prueba con otros filtros o selecciona otro producto."
                  />
                </div>
              ) : (
                <>
                  <div className="kardex-table-wrapper">
                    <table className="kardex-table">
                      <thead>
                        <tr>
                          <th>
                            #
                          </th>

                          <th>
                            Fecha
                          </th>

                          <th>
                            Operación
                          </th>

                          <th>
                            Motivo
                          </th>

                          <th>
                            Documento
                          </th>

                          <th className="kardex-number-column">
                            Ingreso
                          </th>

                          <th className="kardex-number-column">
                            Salida
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
                            index,
                          ) => {
                            const normalized =
                              normalizeType(
                                movement
                                  .movement_type,
                              );

                            return (
                              <tr
                                key={
                                  movement
                                    .id
                                }
                              >
                                <td className="kardex-row-number">
                                  {
                                    startOffset
                                    + index
                                    + 1
                                  }
                                </td>

                                <td>
                                  <div className="kardex-date-cell">
                                    <strong>
                                      {formatDate(
                                        movement
                                          .movement_date,
                                      )}
                                    </strong>

                                    <small>
                                      {formatTime(
                                        movement
                                          .movement_date,
                                      )}
                                    </small>
                                  </div>
                                </td>

                                <td>
                                  <span
                                    className={
                                      `kardex-operation ${
                                        normalized
                                      }`
                                    }
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
                                  <span className="kardex-reason">
                                    {
                                      movement
                                        .reason
                                      || referenceTypeLabel(
                                        movement
                                          .reference_type,
                                      )
                                    }
                                  </span>
                                </td>

                                <td>
                                  <div className="kardex-reference-cell">
                                    <strong>
                                      {
                                        movement
                                          .reference_label
                                        || "—"
                                      }
                                    </strong>

                                    <small>
                                      {referenceTypeLabel(
                                        movement
                                          .reference_type,
                                      )}
                                    </small>
                                  </div>
                                </td>

                                <td className="kardex-number-column">
                                  {normalized ===
                                  "entry" ? (
                                    <strong className="kardex-entry-value">
                                      +
                                      {formatQuantity(
                                        movement
                                          .quantity,
                                      )}
                                    </strong>
                                  ) : (
                                    <span className="kardex-zero-value">
                                      —
                                    </span>
                                  )}
                                </td>

                                <td className="kardex-number-column">
                                  {normalized ===
                                  "exit" ? (
                                    <strong className="kardex-exit-value">
                                      -
                                      {formatQuantity(
                                        movement
                                          .quantity,
                                      )}
                                    </strong>
                                  ) : (
                                    <span className="kardex-zero-value">
                                      —
                                    </span>
                                  )}
                                </td>

                                <td>
                                  <span className="kardex-user">
                                    {
                                      movement
                                        .user_name
                                      || "Sistema"
                                    }
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
                        {
                          filteredMovements
                            .length
                        }
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
                        aria-label="Página anterior"
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
                        aria-label="Página siguiente"
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
          </main>


          <aside className="kardex-side-column">
            <section className="kardex-side-card kardex-filter-card">
              <header className="kardex-side-card-header">
                <div>
                  <Filter
                    size={19}
                  />

                  <h2>
                    Filtros de consulta
                  </h2>
                </div>

                <button
                  type="button"
                  className="kardex-link-button"
                  data-export-hide="true"
                  onClick={
                    clearFilters
                  }
                >
                  Limpiar filtros
                </button>
              </header>

              <div className="kardex-filter-grid">
                <label>
                  <span>
                    Tipo de operación
                  </span>

                  <select
                    value={
                      movementFilter
                    }
                    onChange={(event) => {
                      setMovementFilter(
                        event
                          .target
                          .value as MovementFilter,
                      );

                      setPage(1);
                    }}
                  >
                    <option value="all">
                      Todos
                    </option>

                    <option value="entry">
                      Entradas
                    </option>

                    <option value="exit">
                      Salidas
                    </option>
                  </select>
                </label>

                <label>
                  <span>
                    Referencia
                  </span>

                  <select
                    value={
                      referenceFilter
                    }
                    onChange={(event) => {
                      setReferenceFilter(
                        event
                          .target
                          .value,
                      );

                      setPage(1);
                    }}
                  >
                    <option value="all">
                      Todas
                    </option>

                    {referenceOptions.map(
                      (option) => (
                        <option
                          key={
                            option
                          }
                          value={
                            option
                          }
                        >
                          {referenceTypeLabel(
                            option,
                          )}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label>
                  <span>
                    Desde
                  </span>

                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => {
                      setDateFrom(
                        event
                          .target
                          .value,
                      );

                      setPage(1);
                    }}
                  />
                </label>

                <label>
                  <span>
                    Hasta
                  </span>

                  <input
                    type="date"
                    value={dateTo}
                    onChange={(event) => {
                      setDateTo(
                        event
                          .target
                          .value,
                      );

                      setPage(1);
                    }}
                  />
                </label>
              </div>

              <div className="kardex-filter-status">
                <SlidersHorizontal
                  size={15}
                />

                <span>
                  Los filtros se aplican
                  automáticamente.
                </span>
              </div>
            </section>


            <section className="kardex-side-card kardex-movement-summary">
              <header className="kardex-side-card-header simple">
                <div>
                  <ClipboardList
                    size={19}
                  />

                  <h2>
                    Resumen de movimientos
                  </h2>
                </div>
              </header>

              <div className="kardex-summary-row">
                <div>
                  <span className="kardex-summary-dot entry" />

                  <span>
                    Entradas
                  </span>
                </div>

                <strong className="entry">
                  +
                  {formatQuantity(
                    movementSummary
                      .entryQuantity,
                  )}
                </strong>
              </div>

              <div className="kardex-summary-bar">
                <span
                  className="entry"
                  style={{
                    width:
                      movementSummary
                        .total > 0
                        ? `${
                            (
                              movementSummary
                                .entryCount
                              / movementSummary
                                .total
                            ) * 100
                          }%`
                        : "0%",
                  }}
                />
              </div>

              <div className="kardex-summary-row">
                <div>
                  <span className="kardex-summary-dot exit" />

                  <span>
                    Salidas
                  </span>
                </div>

                <strong className="exit">
                  -
                  {formatQuantity(
                    movementSummary
                      .exitQuantity,
                  )}
                </strong>
              </div>

              <div className="kardex-summary-bar">
                <span
                  className="exit"
                  style={{
                    width:
                      movementSummary
                        .total > 0
                        ? `${
                            (
                              movementSummary
                                .exitCount
                              / movementSummary
                                .total
                            ) * 100
                          }%`
                        : "0%",
                  }}
                />
              </div>

              <div className="kardex-summary-total">
                <span>
                  Movimientos consultados
                </span>

                <strong>
                  {
                    movementSummary
                      .total
                  }
                </strong>
              </div>
            </section>


            <section className="kardex-side-card kardex-products-card">
              <header className="kardex-side-card-header simple">
                <div>
                  <Boxes
                    size={19}
                  />

                  <div>
                    <h2>
                      Listado de productos
                    </h2>

                    <small>
                      {
                        inventory
                          .length
                      }{" "}
                      productos
                    </small>
                  </div>
                </div>
              </header>

              <label
                className="kardex-product-search"
                data-export-hide="true"
              >
                <Search
                  size={15}
                />

                <input
                  type="search"
                  value={
                    productSearch
                  }
                  onChange={(event) =>
                    setProductSearch(
                      event
                        .target
                        .value,
                    )
                  }
                  placeholder="Buscar producto..."
                />
              </label>

              <div className="kardex-products-head">
                <span>
                  Código
                </span>

                <span>
                  Descripción
                </span>

                <span>
                  Stock
                </span>
              </div>

              <div className="kardex-products-list">
                {visibleProducts
                  .length === 0 ? (
                  <div className="kardex-products-empty">
                    No se encontraron productos.
                  </div>
                ) : (
                  visibleProducts.map(
                    (item) => (
                      <button
                        key={
                          item
                            .product_id
                        }
                        type="button"
                        className={
                          `kardex-product-row ${
                            selectedProductId
                              === item.product_id
                              ? "active"
                              : ""
                          }`
                        }
                        onClick={() =>
                          selectProduct(
                            item
                              .product_id,
                          )
                        }
                      >
                        <span className="kardex-product-row-sku">
                          {
                            item
                              .sku
                          }
                        </span>

                        <span className="kardex-product-row-name">
                          {
                            item
                              .product_name
                          }
                        </span>

                        <strong>
                          {formatQuantity(
                            item
                              .stock_quantity,
                          )}
                        </strong>
                      </button>
                    ),
                  )
                )}
              </div>
            </section>
          </aside>
        </div>
      )}
    </section>
  );
}
