import {
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertTriangle,
  Eye,
  FileClock,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";

import ExportActions from "../../components/ui/ExportActions";
import Modal from "../../components/ui/Modal";

import {
  useApiResource,
} from "../../hooks/useApiResource";

import {
  getAuditLogs,
} from "../../services/audit.service";

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
  AuditLogItem,
} from "../../types/audit";

import "./audit-commercial.css";


const PAGE_SIZE = 10;


function normalize(
  value:
    string
    | null
    | undefined,
) {
  return (
    value
      ?.normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        "",
      )
      .trim()
      .toLowerCase()
    ?? ""
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
      dateStyle:
        "medium",

      timeStyle:
        "short",
    },
  ).format(date);
}


function translateAction(
  value: string,
) {
  const normalized =
    normalize(value)
      .replace(
        /[_\s]+/g,
        ".",
      );

  const translations:
    Record<string, string> = {
      "user.login":
        "Inicio de sesión",

      "user.logout":
        "Cierre de sesión",

      "user.created":
        "Usuario creado",

      "user.updated":
        "Usuario actualizado",

      "user.activated":
        "Usuario activado",

      "user.deactivated":
        "Usuario desactivado",

      "sale.created":
        "Venta registrada",

      "sale.updated":
        "Venta actualizada",

      "sale.cancelled":
        "Venta anulada",

      "sale.canceled":
        "Venta anulada",

      "customer.created":
        "Cliente creado",

      "customer.updated":
        "Cliente actualizado",

      "customer.deactivated":
        "Cliente desactivado",

      "product.created":
        "Producto creado",

      "product.updated":
        "Producto actualizado",

      "product.deactivated":
        "Producto desactivado",

      "category.created":
        "Categoría creada",

      "category.updated":
        "Categoría actualizada",

      "category.deactivated":
        "Categoría desactivada",

      "inventory.entry":
        "Entrada de inventario",

      "inventory.exit":
        "Salida de inventario",

      "inventory.movement":
        "Movimiento de inventario",

      "branch.created":
        "Sucursal creada",

      "branch.updated":
        "Sucursal actualizada",

      "company.updated":
        "Empresa actualizada",
    };

  if (
    translations[
      normalized
    ]
  ) {
    return translations[
      normalized
    ];
  }

  return value
    .replace(
      /[._-]+/g,
      " ",
    )
    .replace(
      /\b\w/g,
      (
        letter,
      ) =>
        letter
          .toUpperCase(),
    );
}


function translateEntity(
  value:
    string
    | null,
) {
  if (!value) {
    return "Sistema";
  }

  const normalized =
    normalize(value);

  const translations:
    Record<string, string> = {
      auth_sessions:
        "Sesiones",

      users:
        "Usuarios",

      sales:
        "Ventas",

      sale_details:
        "Detalle de venta",

      customers:
        "Clientes",

      products:
        "Productos",

      categories:
        "Categorías",

      inventory:
        "Inventario",

      inventory_movements:
        "Kardex",

      branches:
        "Sucursales",

      companies:
        "Empresa",

      insights:
        "Insights",

      reports:
        "Reportes",

      datasets:
        "Datos analíticos",

      statistical_analyses:
        "Análisis estadístico",

      bayes_analyses:
        "Probabilidad",

      random_variables:
        "Variables aleatorias",
    };

  return (
    translations[
      normalized
    ]
    ?? value
      .replace(
        /_/g,
        " ",
      )
      .replace(
        /\b\w/g,
        (
          letter,
        ) =>
          letter
            .toUpperCase(),
      )
  );
}


function formatDataKey(
  value: string,
) {
  const translations:
    Record<string, string> = {
      status:
        "Estado",

      name:
        "Nombre",

      first_name:
        "Nombres",

      last_name:
        "Apellidos",

      email:
        "Correo",

      phone:
        "Teléfono",

      role:
        "Rol",

      role_id:
        "Rol",

      total:
        "Total",

      subtotal:
        "Subtotal",

      discount:
        "Descuento",

      tax:
        "Impuesto",

      stock_quantity:
        "Stock",

      minimum_stock:
        "Stock mínimo",

      maximum_stock:
        "Stock máximo",

      sale_number:
        "Número de venta",

      product_id:
        "Producto",

      customer_id:
        "Cliente",
    };

  return (
    translations[
      value
    ]
    ?? value
      .replace(
        /_/g,
        " ",
      )
      .replace(
        /\b\w/g,
        (
          letter,
        ) =>
          letter
            .toUpperCase(),
      )
  );
}


function formatDataValue(
  value: unknown,
) {
  if (
    value === null
    || value === undefined
  ) {
    return "—";
  }

  if (
    typeof value ===
      "boolean"
  ) {
    return value
      ? "Sí"
      : "No";
  }

  if (
    typeof value ===
      "number"
  ) {
    return new Intl.NumberFormat(
      "es-PE",
      {
        maximumFractionDigits:
          4,
      },
    ).format(value);
  }

  if (
    typeof value ===
      "object"
  ) {
    try {
      return JSON.stringify(
        value,
      );
    } catch {
      return String(
        value,
      );
    }
  }

  const text =
    String(value);

  const normalized =
    normalize(text);

  const translations:
    Record<string, string> = {
      active:
        "Activo",

      inactive:
        "Inactivo",

      cancelled:
        "Anulado",

      canceled:
        "Anulado",

      completed:
        "Completado",

      pending:
        "Pendiente",
    };

  return (
    translations[
      normalized
    ]
    ?? text
  );
}


function dataToText(
  data:
    Record<string, unknown>
    | null,
) {
  if (!data) {
    return "";
  }

  return Object.entries(
    data,
  )
    .map(
      (
        [
          key,
          value,
        ],
      ) =>
        `${formatDataKey(key)}: ${formatDataValue(value)}`,
    )
    .join("; ");
}


function actionClass(
  action: string,
) {
  const value =
    normalize(action);

  if (
    value.includes(
      "cancel",
    )
    || value.includes(
      "delete",
    )
    || value.includes(
      "deactiv",
    )
  ) {
    return "audit-action danger";
  }

  if (
    value.includes(
      "created",
    )
    || value.includes(
      "login",
    )
    || value.includes(
      "entry",
    )
  ) {
    return "audit-action success";
  }

  if (
    value.includes(
      "updated",
    )
  ) {
    return "audit-action info";
  }

  return "audit-action";
}


function AuditPage() {
  const exportRef =
    useRef<HTMLElement>(
      null,
    );

  const {
    data,
    loading,
    error,
    reload,
  } =
    useApiResource<
      AuditLogItem[]
    >(
      getAuditLogs,
    );


  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    actionFilter,
    setActionFilter,
  ] =
    useState("all");

  const [
    entityFilter,
    setEntityFilter,
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
    selected,
    setSelected,
  ] =
    useState<
      AuditLogItem | null
    >(null);

  const [
    exportError,
    setExportError,
  ] =
    useState("");


  const logs =
    data ?? [];


  const actionOptions =
    useMemo(
      () =>
        Array.from(
          new Set(
            logs.map(
              (
                item,
              ) =>
                item.action,
            ),
          ),
        ).sort(
          (
            left,
            right,
          ) =>
            translateAction(
              left,
            ).localeCompare(
              translateAction(
                right,
              ),
              "es",
            ),
        ),
      [
        logs,
      ],
    );


  const entityOptions =
    useMemo(
      () =>
        Array.from(
          new Set(
            logs
              .map(
                (
                  item,
                ) =>
                  item.table_name,
              )
              .filter(
                (
                  value,
                ): value is string =>
                  Boolean(
                    value,
                  ),
              ),
          ),
        ).sort(
          (
            left,
            right,
          ) =>
            translateEntity(
              left,
            ).localeCompare(
              translateEntity(
                right,
              ),
              "es",
            ),
        ),
      [
        logs,
      ],
    );


  const filteredLogs =
    useMemo(
      () => {
        const query =
          normalize(
            search,
          );

        return logs.filter(
          (
            item,
          ) => {
            const searchable =
              [
                item.user_name,
                item.user_role,
                item.action,
                translateAction(
                  item.action,
                ),
                item.table_name,
                translateEntity(
                  item.table_name,
                ),
                item.record_id,
                item.ip_address,
              ]
                .map(
                  (
                    value,
                  ) =>
                    normalize(
                      value,
                    ),
                )
                .join(" ");


            const matchesSearch =
              !query
              || searchable.includes(
                query,
              );


            const matchesAction =
              actionFilter ===
                "all"
              || item.action ===
                actionFilter;


            const matchesEntity =
              entityFilter ===
                "all"
              || item.table_name ===
                entityFilter;


            const createdAt =
              new Date(
                item.created_at,
              );


            let matchesFrom =
              true;

            let matchesTo =
              true;


            if (
              dateFrom
              && !Number.isNaN(
                createdAt.getTime(),
              )
            ) {
              const start =
                new Date(
                  `${dateFrom}T00:00:00`,
                );

              matchesFrom =
                createdAt >=
                start;
            }


            if (
              dateTo
              && !Number.isNaN(
                createdAt.getTime(),
              )
            ) {
              const end =
                new Date(
                  `${dateTo}T23:59:59.999`,
                );

              matchesTo =
                createdAt <=
                end;
            }


            return (
              matchesSearch
              && matchesAction
              && matchesEntity
              && matchesFrom
              && matchesTo
            );
          },
        );
      },
      [
        logs,
        search,
        actionFilter,
        entityFilter,
        dateFrom,
        dateTo,
      ],
    );


  const pageCount =
    Math.max(
      1,
      Math.ceil(
        filteredLogs.length
        / PAGE_SIZE,
      ),
    );


  const currentPage =
    Math.min(
      page,
      pageCount,
    );


  const paginatedLogs =
    filteredLogs.slice(
      (
        currentPage - 1
      )
      * PAGE_SIZE,

      currentPage
      * PAGE_SIZE,
    );


  function resetPage() {
    setPage(1);
  }


  function exportRows():
    ExportRow[] {
    return filteredLogs.map(
      (
        item,
      ) => ({
        Fecha:
          formatDate(
            item.created_at,
          ),

        Usuario:
          item.user_name,

        Rol:
          item.user_role
          ?? "—",

        Acción:
          translateAction(
            item.action,
          ),

        Área:
          translateEntity(
            item.table_name,
          ),

        "ID del registro":
          item.record_id
          ?? "",

        IP:
          item.ip_address
          ?? "",

        "Datos anteriores":
          dataToText(
            item.old_data,
          ),

        "Datos nuevos":
          dataToText(
            item.new_data,
          ),

        Navegador:
          item.user_agent
          ?? "",
      }),
    );
  }


  function exportFilename() {
    return (
      `auditoria-${exportDateStamp()}`
    );
  }


  async function handlePdf() {
    if (
      !exportRef.current
      || filteredLogs.length ===
        0
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
    if (
      filteredLogs.length ===
      0
    ) {
      return;
    }

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
    if (
      filteredLogs.length ===
      0
    ) {
      return;
    }

    setExportError("");

    try {
      await exportRowsToExcel(
        exportFilename(),
        "Auditoría",
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
      || filteredLogs.length ===
        0
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
        "Auditoría - SalesIA Enterprise",
        "Registros de auditoría de SalesIA Enterprise.",
      );
    } catch (
      currentError
    ) {
      setExportError(
        currentError
          instanceof Error
          ? currentError.message
          : "No se pudo compartir la auditoría.",
      );
    }
  }


  async function handleReload() {
    setExportError("");

    await reload();
  }


  const oldEntries =
    selected?.old_data
      ? Object.entries(
          selected.old_data,
        )
      : [];


  const newEntries =
    selected?.new_data
      ? Object.entries(
          selected.new_data,
        )
      : [];


  return (
    <>
      <section
        ref={exportRef}
        className="audit-page"
      >
        <header className="audit-header">
          <div>
            <div className="audit-eyebrow">
              <ShieldCheck
                size={14}
              />

              Control y trazabilidad
            </div>

            <h1>
              Auditoría
            </h1>

            <p>
              Consulta la actividad registrada
              y los cambios realizados dentro
              del sistema.
            </p>
          </div>


          <div
            className="audit-header-actions"
            data-export-hide="true"
          >
            <ExportActions
              disabled={
                loading
                || filteredLogs.length ===
                  0
              }
              onPdf={
                handlePdf
              }
              onCsv={
                handleCsv
              }
              onExcel={
                handleExcel
              }
              onShare={
                handleShare
              }
            />

            <button
              type="button"
              className="audit-refresh-button"
              disabled={
                loading
              }
              onClick={() => {
                void handleReload();
              }}
            >
              <RefreshCw
                size={15}
              />

              Actualizar
            </button>
          </div>
        </header>


        {exportError && (
          <div
            className="audit-export-error"
            data-export-hide="true"
          >
            {exportError}
          </div>
        )}


        <section className="audit-panel">
          <div
            className="audit-toolbar"
            data-export-hide="true"
          >
            <div className="audit-search">
              <Search
                size={15}
              />

              <input
                type="search"
                value={
                  search
                }
                onChange={(
                  event,
                ) => {
                  setSearch(
                    event.target.value,
                  );

                  resetPage();
                }}
                placeholder="Buscar usuario, acción, área o registro..."
              />
            </div>


            <select
              value={
                actionFilter
              }
              onChange={(
                event,
              ) => {
                setActionFilter(
                  event.target.value,
                );

                resetPage();
              }}
            >
              <option value="all">
                Todas las acciones
              </option>

              {actionOptions.map(
                (
                  action,
                ) => (
                  <option
                    key={
                      action
                    }
                    value={
                      action
                    }
                  >
                    {translateAction(
                      action,
                    )}
                  </option>
                ),
              )}
            </select>


            <select
              value={
                entityFilter
              }
              onChange={(
                event,
              ) => {
                setEntityFilter(
                  event.target.value,
                );

                resetPage();
              }}
            >
              <option value="all">
                Todas las áreas
              </option>

              {entityOptions.map(
                (
                  entity,
                ) => (
                  <option
                    key={
                      entity
                    }
                    value={
                      entity
                    }
                  >
                    {translateEntity(
                      entity,
                    )}
                  </option>
                ),
              )}
            </select>


            <input
              type="date"
              value={
                dateFrom
              }
              onChange={(
                event,
              ) => {
                setDateFrom(
                  event.target.value,
                );

                resetPage();
              }}
              aria-label="Fecha inicial"
            />


            <input
              type="date"
              value={
                dateTo
              }
              onChange={(
                event,
              ) => {
                setDateTo(
                  event.target.value,
                );

                resetPage();
              }}
              aria-label="Fecha final"
            />
          </div>


          <div className="audit-panel-heading">
            <div>
              <FileClock
                size={18}
              />

              <div>
                <strong>
                  Registro de actividad
                </strong>

                <span>
                  {filteredLogs.length}
                  {" "}
                  registro
                  {filteredLogs.length ===
                  1
                    ? ""
                    : "s"}
                </span>
              </div>
            </div>
          </div>


          {loading ? (
            <div className="audit-state">
              <div className="audit-spinner" />

              <strong>
                Cargando auditoría
              </strong>
            </div>
          ) : error ? (
            <div
              className="audit-state error"
              role="alert"
            >
              <AlertTriangle
                size={22}
              />

              <strong>
                No se pudo cargar la auditoría
              </strong>

              <p>
                {error}
              </p>
            </div>
          ) : filteredLogs.length ===
            0 ? (
            <div className="audit-state">
              <ShieldCheck
                size={28}
              />

              <strong>
                Sin registros
              </strong>

              <p>
                No existen registros que
                coincidan con los filtros
                seleccionados.
              </p>
            </div>
          ) : (
            <>
              <div className="audit-table-wrap">
                <table className="audit-table">
                  <thead>
                    <tr>
                      <th>
                        Fecha
                      </th>

                      <th>
                        Usuario
                      </th>

                      <th>
                        Acción
                      </th>

                      <th>
                        Área
                      </th>

                      <th>
                        IP
                      </th>

                      <th
                        data-export-hide="true"
                      >
                        Detalle
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedLogs.map(
                      (
                        item,
                      ) => (
                        <tr
                          key={
                            item.id
                          }
                        >
                          <td>
                            <span className="audit-date">
                              {formatDate(
                                item.created_at,
                              )}
                            </span>
                          </td>

                          <td>
                            <div className="audit-user">
                              <strong>
                                {item.user_name}
                              </strong>

                              <span>
                                {item.user_role
                                  ?? "Sistema"}
                              </span>
                            </div>
                          </td>

                          <td>
                            <span
                              className={
                                actionClass(
                                  item.action,
                                )
                              }
                            >
                              {translateAction(
                                item.action,
                              )}
                            </span>
                          </td>

                          <td>
                            {translateEntity(
                              item.table_name,
                            )}
                          </td>

                          <td>
                            <span className="audit-ip">
                              {item.ip_address
                                ?? "—"}
                            </span>
                          </td>

                          <td
                            data-export-hide="true"
                          >
                            <button
                              type="button"
                              className="audit-detail-button"
                              onClick={() =>
                                setSelected(
                                  item,
                                )
                              }
                            >
                              <Eye
                                size={14}
                              />

                              Ver
                            </button>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>


              <div
                className="audit-pagination"
                data-export-hide="true"
              >
                <button
                  type="button"
                  disabled={
                    currentPage <=
                    1
                  }
                  onClick={() =>
                    setPage(
                      (
                        current,
                      ) =>
                        Math.max(
                          1,
                          current - 1,
                        ),
                    )
                  }
                >
                  Anterior
                </button>

                <span>
                  Página
                  {" "}
                  {currentPage}
                  {" "}
                  de
                  {" "}
                  {pageCount}
                </span>

                <button
                  type="button"
                  disabled={
                    currentPage >=
                    pageCount
                  }
                  onClick={() =>
                    setPage(
                      (
                        current,
                      ) =>
                        Math.min(
                          pageCount,
                          current + 1,
                        ),
                    )
                  }
                >
                  Siguiente
                </button>
              </div>
            </>
          )}
        </section>
      </section>


      <Modal
        open={
          Boolean(
            selected,
          )
        }
        title="Detalle de auditoría"
        description={
          selected
            ? `${translateAction(
                selected.action,
              )} · ${formatDate(
                selected.created_at,
              )}`
            : ""
        }
        onClose={() =>
          setSelected(
            null,
          )
        }
      >
        {selected && (
          <div className="audit-detail">
            <div className="audit-detail-grid">
              <div>
                <span>
                  Usuario
                </span>

                <strong>
                  {selected.user_name}
                </strong>
              </div>

              <div>
                <span>
                  Rol
                </span>

                <strong>
                  {selected.user_role
                    ?? "Sistema"}
                </strong>
              </div>

              <div>
                <span>
                  Acción
                </span>

                <strong>
                  {translateAction(
                    selected.action,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Área
                </span>

                <strong>
                  {translateEntity(
                    selected.table_name,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  IP
                </span>

                <strong>
                  {selected.ip_address
                    ?? "—"}
                </strong>
              </div>

              <div>
                <span>
                  Registro
                </span>

                <strong className="audit-detail-id">
                  {selected.record_id
                    ?? "—"}
                </strong>
              </div>
            </div>


            <section className="audit-change-section">
              <h3>
                Datos anteriores
              </h3>

              {oldEntries.length ===
              0 ? (
                <p className="audit-no-data">
                  No se registraron datos
                  anteriores.
                </p>
              ) : (
                <div className="audit-change-list">
                  {oldEntries.map(
                    (
                      [
                        key,
                        value,
                      ],
                    ) => (
                      <div
                        key={
                          key
                        }
                      >
                        <span>
                          {formatDataKey(
                            key,
                          )}
                        </span>

                        <strong>
                          {formatDataValue(
                            value,
                          )}
                        </strong>
                      </div>
                    ),
                  )}
                </div>
              )}
            </section>


            <section className="audit-change-section">
              <h3>
                Datos nuevos
              </h3>

              {newEntries.length ===
              0 ? (
                <p className="audit-no-data">
                  No se registraron datos
                  nuevos.
                </p>
              ) : (
                <div className="audit-change-list">
                  {newEntries.map(
                    (
                      [
                        key,
                        value,
                      ],
                    ) => (
                      <div
                        key={
                          key
                        }
                      >
                        <span>
                          {formatDataKey(
                            key,
                          )}
                        </span>

                        <strong>
                          {formatDataValue(
                            value,
                          )}
                        </strong>
                      </div>
                    ),
                  )}
                </div>
              )}
            </section>


            {selected.user_agent && (
              <section className="audit-browser">
                <span>
                  Navegador / dispositivo
                </span>

                <p>
                  {selected.user_agent}
                </p>
              </section>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}


export default AuditPage;
