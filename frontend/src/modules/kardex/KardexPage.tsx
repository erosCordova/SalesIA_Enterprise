import {
  useCallback,
  useMemo,
  useState,
  useEffect,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  History,
  LayoutDashboard,
  ListTree,
  PackageSearch,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import type {
  LucideIcon,
} from "lucide-react";

import DataTable, {
  type DataTableColumn,
} from "../../components/ui/DataTable";

import ModuleState from "../../components/ui/ModuleState";
import Pagination from "../../components/ui/Pagination";

import {
  getInventory,
} from "../../services/commercial.service";

import {
  createInventoryMovement,
  getInventoryMovements,
} from "../../services/inventory.service";

import type {
  InventoryItem,
} from "../../types/commercial";

import type {
  InventoryMovement,
  InventoryMovementType,
} from "../../types/inventory";

import "./kardex.css";


type KardexSection =
  | "summary"
  | "all"
  | "entry"
  | "exit";


interface SectionDefinition {
  key: KardexSection;
  label: string;
  description: string;
  icon: LucideIcon;
}


const PAGE_SIZE = 10;


const SECTIONS:
  SectionDefinition[] = [
    {
      key: "summary",
      label: "Resumen",
      description:
        "Vista general del movimiento de existencias.",
      icon: LayoutDashboard,
    },
    {
      key: "all",
      label: "Todos los movimientos",
      description:
        "Trazabilidad completa del Kardex.",
      icon: ListTree,
    },
    {
      key: "entry",
      label: "Entradas",
      description:
        "Ingresos y reposiciones de stock.",
      icon: ArrowDownToLine,
    },
    {
      key: "exit",
      label: "Salidas",
      description:
        "Ventas y otras salidas de stock.",
      icon: ArrowUpFromLine,
    },
  ];


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


function KardexPage() {
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
    lastUpdated,
    setLastUpdated,
  ] =
    useState<Date | null>(
      null,
    );

  const [
    section,
    setSection,
  ] =
    useState<KardexSection>(
      "summary",
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

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

          setLastUpdated(
            new Date(),
          );
        } catch (requestError) {
          setError(
            requestError
              instanceof Error
              ? requestError.message
              : (
                "No se pudo cargar "
                + "el Kardex."
              ),
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


  const stats =
    useMemo(
      () => {
        const entries =
          movements.filter(
            (movement) =>
              normalizeType(
                movement.movement_type,
              ) === "entry",
          );

        const exits =
          movements.filter(
            (movement) =>
              normalizeType(
                movement.movement_type,
              ) === "exit",
          );

        const products =
          new Set(
            movements.map(
              (movement) =>
                movement.product_id,
            ),
          );

        return {
          total: movements.length,
          entries:
            entries.length,
          exits:
            exits.length,
          products:
            products.size,
        };
      },
      [
        movements,
      ],
    );


  const selectedProduct =
    useMemo(
      () =>
        inventory.find(
          (item) =>
            item.product_id
            === productId,
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
              section === "entry"
              && normalizedType
                !== "entry"
            ) {
              return false;
            }

            if (
              section === "exit"
              && normalizedType
                !== "exit"
            ) {
              return false;
            }

            const movementDate =
              movement
                .movement_date
                .slice(0, 10);

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
                  .includes(
                    query,
                  ),
            );
          },
        );
      },
      [
        movements,
        section,
        search,
        dateFrom,
        dateTo,
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


  const displayedMovements =
    useMemo(
      () => {
        if (
          section ===
          "summary"
        ) {
          return filteredMovements
            .slice(0, 8);
        }

        const start =
          (
            safePage - 1
          ) * PAGE_SIZE;

        return filteredMovements
          .slice(
            start,
            start + PAGE_SIZE,
          );
      },
      [
        filteredMovements,
        safePage,
        section,
      ],
    );


  const currentSection =
    SECTIONS.find(
      (item) =>
        item.key === section,
    ) ?? SECTIONS[0];

  const CurrentIcon =
    currentSection.icon;


  const columns:
    DataTableColumn<
      InventoryMovement
    >[] = [
      {
        key: "date",
        label: "Fecha",
        render: (
          movement,
        ) => (
          <span className="kardex-date">
            {formatDate(
              movement.movement_date,
            )}
          </span>
        ),
      },

      {
        key: "product",
        label: "Producto",
        render: (
          movement,
        ) => (
          <div className="kardex-product">
            <span className="kardex-product-icon">
              <PackageSearch
                size={16}
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
                SKU{" "}
                {
                  movement.sku
                }
              </small>
            </span>
          </div>
        ),
      },

      {
        key: "type",
        label: "Tipo",
        render: (
          movement,
        ) => {
          const normalized =
            normalizeType(
              movement
                .movement_type,
            );

          return (
            <span
              className={
                `kardex-type ${
                  normalized ===
                  "entry"
                    ? "entry"
                    : normalized ===
                      "exit"
                      ? "exit"
                      : "other"
                }`
              }
            >
              {
                typeLabel(
                  movement
                    .movement_type,
                )
              }
            </span>
          );
        },
      },

      {
        key: "quantity",
        label: "Cantidad",
        render: (
          movement,
        ) => (
          <strong>
            {
              formatQuantity(
                movement.quantity,
              )
            }
          </strong>
        ),
      },

      {
        key: "reference",
        label: "Referencia",
        render: (
          movement,
        ) => (
          <span className="kardex-muted">
            {
              movement
                .reference_label
              || "Sin referencia"
            }
          </span>
        ),
      },

      {
        key: "reason",
        label: "Motivo",
        render: (
          movement,
        ) => (
          <span className="kardex-reason">
            {
              movement.reason
              || "Sin detalle"
            }
          </span>
        ),
      },

      {
        key: "user",
        label: "Registrado por",
        render: (
          movement,
        ) => (
          <span className="kardex-muted">
            {
              movement.user_name
            }
          </span>
        ),
      },
    ];


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
      reason.trim().length < 3
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

      setQuantity("");
      setReason("");

      setFormMessage({
        type: "success",
        text:
          "Movimiento registrado correctamente.",
      });

      await loadData();
    } catch (requestError) {
      setFormMessage({
        type: "error",
        text:
          requestError
            instanceof Error
            ? requestError.message
            : (
              "No se pudo registrar "
              + "el movimiento."
            ),
      });
    } finally {
      setSaving(false);
    }
  }


  return (
    <section className="kardex-page">
      <header className="kardex-header">
        <div>
          <span className="kardex-eyebrow">
            Operaciones
          </span>

          <h1>
            Kardex de inventario
          </h1>

          <p>
            Consulta la trazabilidad
            de entradas y salidas de
            productos y registra
            movimientos de stock
            autorizados.
          </p>
        </div>

        <div className="kardex-header-actions">
          <button
            type="button"
            className="secondary-button"
            disabled={loading}
            onClick={() =>
              void loadData()
            }
          >
            <RefreshCw
              size={16}
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
            className="primary-button"
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
            {
              formOpen
                ? (
                  <X
                    size={16}
                  />
                )
                : (
                  <Plus
                    size={16}
                  />
                )
            }

            {
              formOpen
                ? "Cerrar"
                : "Registrar movimiento"
            }
          </button>
        </div>
      </header>


      <div className="kardex-stats">
        <article className="kardex-stat-card">
          <div className="kardex-stat-icon">
            <History size={20} />
          </div>

          <div>
            <span>
              Movimientos
            </span>

            <strong>
              {stats.total}
            </strong>

            <small>
              registros del Kardex
            </small>
          </div>
        </article>


        <article className="kardex-stat-card">
          <div className="kardex-stat-icon entry">
            <ArrowDownToLine
              size={20}
            />
          </div>

          <div>
            <span>
              Entradas
            </span>

            <strong>
              {stats.entries}
            </strong>

            <small>
              movimientos de ingreso
            </small>
          </div>
        </article>


        <article className="kardex-stat-card">
          <div className="kardex-stat-icon exit">
            <ArrowUpFromLine
              size={20}
            />
          </div>

          <div>
            <span>
              Salidas
            </span>

            <strong>
              {stats.exits}
            </strong>

            <small>
              movimientos de salida
            </small>
          </div>
        </article>


        <article className="kardex-stat-card">
          <div className="kardex-stat-icon">
            <Boxes size={20} />
          </div>

          <div>
            <span>
              Productos
            </span>

            <strong>
              {stats.products}
            </strong>

            <small>
              con movimientos
            </small>
          </div>
        </article>
      </div>


      {formOpen && (
        <form
          className="kardex-form-panel"
          onSubmit={
            handleSubmit
          }
        >
          <div className="kardex-form-heading">
            <div>
              <strong>
                Registrar movimiento
              </strong>

              <span>
                El stock se actualizará
                automáticamente y la
                operación quedará en
                el Kardex.
              </span>
            </div>
          </div>

          <div className="kardex-form-grid">
            <label>
              <span>
                Producto
              </span>

              <select
                value={productId}
                onChange={(
                  event,
                ) => {
                  setProductId(
                    event
                      .target
                      .value,
                  );
                }}
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
                      {
                        item.product_name
                      }
                      {" — "}
                      {
                        item.sku
                      }
                    </option>
                  ),
                )}
              </select>

              {selectedProduct && (
                <small>
                  Stock actual:{" "}
                  {
                    formatQuantity(
                      selectedProduct
                        .stock_quantity,
                    )
                  }
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
                onChange={(event) => {
                  setMovementType(
                    event.target.value as InventoryMovementType,
                  );
                }}
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
                onChange={(
                  event,
                ) =>
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
                onChange={(
                  event,
                ) =>
                  setReason(
                    event
                      .target
                      .value,
                  )
                }
                placeholder={
                  movementType
                  === "entry"
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
                formMessage.text
              }
            </div>
          )}


          <div className="kardex-form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setFormOpen(false);
                setFormMessage(null);
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {
                saving
                  ? "Registrando..."
                  : "Guardar movimiento"
              }
            </button>
          </div>
        </form>
      )}


      <div className="kardex-workspace">
        <aside className="kardex-nav-panel">
          <div className="kardex-nav-heading">
            <div>
              <span>
                Kardex
              </span>

              <small>
                Control de movimientos
              </small>
            </div>

            <span className="kardex-update-time">
              {
                lastUpdated
                  ? lastUpdated
                      .toLocaleTimeString(
                        "es-PE",
                        {
                          hour:
                            "2-digit",
                          minute:
                            "2-digit",
                        },
                      )
                  : "Pendiente"
              }
            </span>
          </div>

          <div className="kardex-nav-list">
            {SECTIONS.map(
              (item) => {
                const Icon =
                  item.icon;

                const selected =
                  item.key
                  === section;

                let count =
                  stats.total;

                if (
                  item.key
                  === "entry"
                ) {
                  count =
                    stats.entries;
                }

                if (
                  item.key
                  === "exit"
                ) {
                  count =
                    stats.exits;
                }

                return (
                  <button
                    key={item.key}
                    type="button"
                    className={
                      `kardex-nav-item ${
                        selected
                          ? "is-selected"
                          : ""
                      }`
                    }
                    onClick={() => {
                      setSection(
                        item.key,
                      );
                      setPage(1);
                    }}
                  >
                    <span className="kardex-nav-item-main">
                      <span className="kardex-nav-item-icon">
                        <Icon
                          size={18}
                        />
                      </span>

                      <span>
                        <strong>
                          {
                            item.label
                          }
                        </strong>

                        <small>
                          {
                            item.description
                          }
                        </small>
                      </span>
                    </span>

                    <span className="kardex-nav-count">
                      {count}
                    </span>
                  </button>
                );
              },
            )}
          </div>
        </aside>


        <div className="kardex-content">
          <div className="kardex-current-header">
            <div className="kardex-current-title">
              <span className="kardex-current-icon">
                <CurrentIcon
                  size={22}
                />
              </span>

              <div>
                <span className="kardex-current-eyebrow">
                  Control de inventario
                </span>

                <h2>
                  {
                    currentSection
                      .label
                  }
                </h2>

                <p>
                  {
                    currentSection
                      .description
                  }
                </p>
              </div>
            </div>

            <div className="kardex-current-stats">
              <div>
                <span>
                  Mostrados
                </span>

                <strong>
                  {
                    filteredMovements
                      .length
                  }
                </strong>
              </div>

              <div>
                <span>
                  Total
                </span>

                <strong>
                  {stats.total}
                </strong>
              </div>
            </div>
          </div>


          <div className="kardex-module-host">
            <div className="kardex-filters">
              <label className="kardex-search">
                <Search
                  size={17}
                />

                <input
                  type="search"
                  value={search}
                  onChange={(
                    event,
                  ) => {
                    setSearch(
                      event.target
                        .value,
                    );
                    setPage(1);
                  }}
                  placeholder={
                    "Buscar producto, SKU, "
                    + "usuario o motivo"
                  }
                />
              </label>

              <label className="kardex-date-filter">
                <span>
                  Desde
                </span>

                <input
                  type="date"
                  value={dateFrom}
                  onChange={(
                    event,
                  ) => {
                    setDateFrom(
                      event.target
                        .value,
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
                  onChange={(
                    event,
                  ) => {
                    setDateTo(
                      event.target
                        .value,
                    );
                    setPage(1);
                  }}
                />
              </label>

              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setSearch("");
                  setDateFrom("");
                  setDateTo("");
                  setPage(1);
                }}
              >
                Limpiar
              </button>
            </div>


            {loading ? (
              <ModuleState
                type="loading"
                title="Cargando Kardex"
                description={
                  "Consultando los movimientos "
                  + "registrados en inventario."
                }
              />
            ) : error ? (
              <div>
                <ModuleState
                  type="error"
                  title={
                    "No se pudo cargar "
                    + "el Kardex"
                  }
                  description={
                    error
                  }
                />

                <div className="kardex-retry">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      void loadData()
                    }
                  >
                    <RefreshCw
                      size={16}
                    />

                    Reintentar
                  </button>
                </div>
              </div>
            ) : displayedMovements
                .length === 0 ? (
              <ModuleState
                type="empty"
                title={
                  movements.length
                    === 0
                    ? "Aún no hay movimientos"
                    : "No encontramos resultados"
                }
                description={
                  movements.length
                    === 0
                    ? (
                      "Los movimientos aparecerán "
                      + "cuando se registren entradas, "
                      + "salidas o ventas."
                    )
                    : (
                      "Modifica los filtros para "
                      + "consultar otros movimientos."
                    )
                }
              />
            ) : (
              <>
                {section === "summary" && (
                  <div className="kardex-summary-note">
                    <History
                      size={18}
                    />

                    <div>
                      <strong>
                        Actividad reciente
                      </strong>

                      <span>
                        Se muestran los últimos
                        8 movimientos registrados.
                      </span>
                    </div>
                  </div>
                )}

                <DataTable
                  columns={columns}
                  data={
                    displayedMovements
                  }
                  getRowKey={(
                    movement,
                  ) =>
                    movement.id
                  }
                />

                {section !==
                  "summary" && (
                  <Pagination
                    page={
                      safePage
                    }
                    totalPages={
                      totalPages
                    }
                    onPageChange={
                      setPage
                    }
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}


export default KardexPage;
