import {
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  Lightbulb,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";

import ExportActions from "../../components/ui/ExportActions";

import {
  useApiResource,
} from "../../hooks/useApiResource";

import {
  generateInsights,
  getInsights,
} from "../../services/reporting.service";

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
  InsightItem,
} from "../../types/reporting";

import "./insights-commercial.css";


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
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}


function normalize(
  value: string | null | undefined,
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


function translateStatus(
  value: string,
) {
  const normalized =
    normalize(value);

  const translations: Record<string, string> = {
    active: "Activo",
    inactive: "Inactivo",
    pending: "Pendiente",
    resolved: "Resuelto",
    closed: "Cerrado",
    open: "Abierto",
    completed: "Completado",
  };

  return (
    translations[normalized]
    ?? value
  );
}


function translateSeverity(
  value: string | null,
) {
  if (!value) {
    return "";
  }

  const normalized =
    normalize(value);

  const translations: Record<string, string> = {
    critical: "Crítica",
    critica: "Crítica",
    high: "Alta",
    alta: "Alta",
    medium: "Media",
    moderate: "Media",
    moderada: "Media",
    low: "Baja",
    baja: "Baja",
  };

  return (
    translations[normalized]
    ?? value
  );
}


function translateInsightType(
  value: string | null,
) {
  if (!value) {
    return "";
  }

  const normalized =
    normalize(value)
      .replace(/[-_]+/g, " ");

  const exact: Record<string, string> = {
    revenue: "Ingresos",
    sales: "Ventas",

    "sales trend": "Tendencia de ventas",
    "revenue trend": "Tendencia de ingresos",
    "average ticket trend": "Tendencia del ticket promedio",

    average_ticket: "Ticket promedio",
    "average ticket": "Ticket promedio",

    revenue_growth: "Crecimiento de ingresos",
    "revenue growth": "Crecimiento de ingresos",

    revenue_drop: "Caída de ingresos",
    "revenue drop": "Caída de ingresos",

    sales_growth: "Crecimiento de ventas",
    "sales growth": "Crecimiento de ventas",

    sales_drop: "Caída de ventas",
    "sales drop": "Caída de ventas",

    ticket_growth: "Aumento del ticket promedio",
    "ticket growth": "Aumento del ticket promedio",

    ticket_drop: "Caída del ticket promedio",
    "ticket drop": "Caída del ticket promedio",

    trend: "Tendencia",
    warning: "Alerta",
    opportunity: "Oportunidad",
  };

  if (exact[normalized]) {
    return exact[normalized];
  }

  const words: Record<string, string> = {
    revenue: "ingresos",
    sales: "ventas",
    average: "promedio",
    ticket: "ticket",
    growth: "crecimiento",
    increase: "aumento",
    decrease: "disminución",
    drop: "caída",
    trend: "tendencia",
    warning: "alerta",
    opportunity: "oportunidad",
    risk: "riesgo",
    stock: "stock",
    inventory: "inventario",
    customer: "cliente",
    customers: "clientes",
  };

  const translated =
    normalized
      .split(" ")
      .map(
        (word) =>
          words[word]
          ?? word,
      )
      .join(" ");

  return (
    translated
      .charAt(0)
      .toUpperCase()
    + translated.slice(1)
  );
}


function severityClass(
  value: string | null,
) {
  const normalized =
    normalize(value);

  if (
    normalized === "critical"
    || normalized === "critica"
    || normalized === "high"
    || normalized === "alta"
  ) {
    return "insight-severity high";
  }

  if (
    normalized === "medium"
    || normalized === "media"
    || normalized === "moderate"
    || normalized === "moderada"
  ) {
    return "insight-severity medium";
  }

  if (
    normalized === "low"
    || normalized === "baja"
  ) {
    return "insight-severity low";
  }

  return "insight-severity neutral";
}


function statusClass(
  value: string,
) {
  const normalized =
    normalize(value);

  if (
    normalized === "active"
    || normalized === "activo"
    || normalized === "activa"
  ) {
    return "insight-status active";
  }

  if (
    normalized === "resolved"
    || normalized === "resuelto"
    || normalized === "resuelta"
    || normalized === "closed"
    || normalized === "cerrado"
    || normalized === "cerrada"
  ) {
    return "insight-status resolved";
  }

  return "insight-status";
}


function formatEvidenceKey(
  value: string,
) {
  const normalized =
    normalize(value)
      .replace(/[- ]+/g, "_");

  const translations:
    Record<string, string> = {
      rule: "Regla",
      current_sales: "Ventas actuales",
      previous_sales: "Ventas anteriores",
      change_percent: "Variación porcentual",
      current_period: "Periodo actual",
      previous_period: "Periodo anterior",
      current_revenue: "Ingresos actuales",
      previous_revenue: "Ingresos anteriores",
      threshold_percent: "Umbral porcentual",
      current_average_ticket: "Ticket promedio actual",
      previous_average_ticket: "Ticket promedio anterior",
      average_ticket_change: "Variación del ticket promedio",
      revenue_change: "Variación de ingresos",
      sales_change: "Variación de ventas",
      start_date: "Fecha inicial",
      end_date: "Fecha final",
      days: "Días",
      total_sales: "Ventas totales",
      total_revenue: "Ingresos totales",
      average_ticket: "Ticket promedio",
    };

  if (translations[normalized]) {
    return translations[normalized];
  }

  const clean =
    value
      .replace(/_/g, " ")
      .trim();

  return (
    clean.charAt(0).toUpperCase()
    + clean.slice(1)
  );
}


function formatEvidenceValue(
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
        maximumFractionDigits: 4,
      },
    ).format(value);
  }

  if (
    typeof value ===
    "string"
  ) {
    const normalized =
      normalize(value)
        .replace(/[- ]+/g, "_");

    const translations:
      Record<string, string> = {
        weekly_revenue_change:
          "Variación semanal de ingresos",

        weekly_sales_change:
          "Variación semanal de ventas",

        weekly_average_ticket_change:
          "Variación semanal del ticket promedio",

        revenue_growth:
          "Crecimiento de ingresos",

        revenue_drop:
          "Caída de ingresos",

        sales_growth:
          "Crecimiento de ventas",

        sales_drop:
          "Caída de ventas",

        average_ticket_growth:
          "Aumento del ticket promedio",

        average_ticket_drop:
          "Caída del ticket promedio",

        current_period:
          "Periodo actual",

        previous_period:
          "Periodo anterior",

        active:
          "Activo",

        inactive:
          "Inactivo",

        high:
          "Alta",

        medium:
          "Media",

        low:
          "Baja",
      };

    return (
      translations[normalized]
      ?? value
    );
  }

  try {
    return JSON.stringify(
      value,
    );
  } catch {
    return String(value);
  }
}


function uniqueOptions(
  values: Array<
    string | null
  >,
) {
  return Array.from(
    new Set(
      values
        .filter(
          (
            value,
          ): value is string =>
            Boolean(
              value?.trim(),
            ),
        )
        .map(
          (value) =>
            value.trim(),
        ),
    ),
  ).sort(
    (
      left,
      right,
    ) =>
      left.localeCompare(
        right,
        "es",
      ),
  );
}


export default function InsightsPage() {
  const exportRef =
    useRef<HTMLElement>(
      null,
    );


  const [
    exportError,
    setExportError,
  ] =
    useState("");


  const {
    data,
    loading,
    error,
    reload,
  } =
    useApiResource<
      InsightItem[]
    >(getInsights);


  const [
    generating,
    setGenerating,
  ] =
    useState(false);

  const [
    generationError,
    setGenerationError,
  ] =
    useState("");

  const [
    generationMessage,
    setGenerationMessage,
  ] =
    useState("");

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState("all");

  const [
    severityFilter,
    setSeverityFilter,
  ] =
    useState("all");


  const insights =
    data ?? [];


  const statusOptions =
    useMemo(
      () =>
        uniqueOptions(
          insights.map(
            (item) =>
              item.status,
          ),
        ),
      [insights],
    );


  const severityOptions =
    useMemo(
      () =>
        uniqueOptions(
          insights.map(
            (item) =>
              item.severity,
          ),
        ),
      [insights],
    );


  const filteredInsights =
    useMemo(
      () => {
        const query =
          normalize(search);

        return [...insights]
          .filter(
            (insight) => {
              const matchesSearch =
                !query
                || normalize(
                  insight.title,
                ).includes(
                  query,
                )
                || normalize(
                  insight.description,
                ).includes(
                  query,
                )
                || normalize(
                  insight.insight_type,
                ).includes(
                  query,
                )
                || normalize(
                  insight.severity,
                ).includes(
                  query,
                )
                || normalize(
                  insight.status,
                ).includes(
                  query,
                );

              const matchesStatus =
                statusFilter ===
                  "all"
                || normalize(
                  insight.status,
                ) ===
                  normalize(
                    statusFilter,
                  );

              const matchesSeverity =
                severityFilter ===
                  "all"
                || normalize(
                  insight.severity,
                ) ===
                  normalize(
                    severityFilter,
                  );

              return (
                matchesSearch
                && matchesStatus
                && matchesSeverity
              );
            },
          )
          .sort(
            (
              left,
              right,
            ) => {
              const leftTime =
                new Date(
                  left.created_at,
                ).getTime();

              const rightTime =
                new Date(
                  right.created_at,
                ).getTime();

              if (
                Number.isNaN(
                  leftTime,
                )
                || Number.isNaN(
                  rightTime,
                )
              ) {
                return 0;
              }

              return (
                rightTime
                - leftTime
              );
            },
          );
      },
      [
        insights,
        search,
        statusFilter,
        severityFilter,
      ],
    );


  function evidenceText(
    insight: InsightItem,
  ) {
    if (!insight.evidence) {
      return "";
    }


    return Object.entries(
      insight.evidence,
    )
      .map(
        ([key, value]) =>
          `${formatEvidenceKey(key)}: ${formatEvidenceValue(value)}`,
      )
      .join("; ");
  }


  function exportRows(): ExportRow[] {
    return filteredInsights.map(
      (insight) => ({
        Fecha:
          formatDate(
            insight.created_at,
          ),

        Tipo:
          insight.insight_type
            ? translateInsightType(
                insight.insight_type,
              )
            : "",

        Severidad:
          insight.severity
            ? translateSeverity(
                insight.severity,
              )
            : "",

        Estado:
          translateStatus(
            insight.status,
          ),

        Título:
          insight.title,

        Descripción:
          insight.description,

        Evidencia:
          evidenceText(
            insight,
          ),
      }),
    );
  }


  function exportFilename() {
    return `insights-${exportDateStamp()}`;
  }


  async function handlePdf() {
    if (
      !exportRef.current
      || filteredInsights.length === 0
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
    if (
      filteredInsights.length === 0
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
        currentError instanceof Error
          ? currentError.message
          : "No se pudo generar el CSV.",
      );
    }
  }


  async function handleExcel() {
    if (
      filteredInsights.length === 0
    ) {
      return;
    }


    setExportError("");


    try {
      await exportRowsToExcel(
        exportFilename(),
        "Insights",
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
      || filteredInsights.length === 0
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
        "Insights - SalesIA Enterprise",
        "Insights empresariales de SalesIA Enterprise.",
      );
    } catch (
      currentError
    ) {
      setExportError(
        currentError instanceof Error
          ? currentError.message
          : "No se pudieron compartir los insights.",
      );
    }
  }


  async function handleGenerateInsights() {
    setExportError("");

    setGenerating(
      true,
    );

    setGenerationError(
      "",
    );

    setGenerationMessage(
      "",
    );

    try {
      const generated =
        await generateInsights();

      await reload();

      if (
        generated.length > 0
      ) {
        setGenerationMessage(
          `Se generaron ${generated.length} insight(s).`,
        );
      } else {
        setGenerationMessage(
          "El análisis finalizó sin nuevos insights.",
        );
      }
    } catch (
      currentError
    ) {
      setGenerationError(
        currentError
          instanceof Error
          ? currentError.message
          : "No se pudieron generar los insights.",
      );
    } finally {
      setGenerating(
        false,
      );
    }
  }


  async function handleReload() {
    setExportError("");

    setGenerationError(
      "",
    );

    setGenerationMessage(
      "",
    );

    await reload();
  }


  return (
    <section
      ref={exportRef}
      className="insights-page"
    >
      <header className="insights-header">
        <div>
          <div className="insights-eyebrow">
            <Lightbulb
              size={14}
            />

            Inteligencia empresarial
          </div>

          <h1>
            Insights
          </h1>

          <p>
            Identifica observaciones relevantes
            obtenidas a partir de los datos
            empresariales registrados.
          </p>
        </div>


        <div
          className="insights-header-actions"
          data-export-hide="true"
        >
          <ExportActions
            disabled={
              loading
              || generating
              || filteredInsights.length === 0
            }
            onPdf={handlePdf}
            onCsv={handleCsv}
            onExcel={handleExcel}
            onShare={handleShare}
          />


          <button
            type="button"
            className="insights-secondary-button"
            disabled={
              loading
              || generating
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

          <button
            type="button"
            className="insights-primary-button"
            disabled={
              loading
              || generating
            }
            onClick={() => {
              void handleGenerateInsights();
            }}
          >
            <Sparkles
              size={15}
            />

            {generating
              ? "Analizando..."
              : "Generar insights"}
          </button>
        </div>
      </header>


      {generationMessage && (
        <div
          className="insights-message success"
          role="status"
          data-export-hide="true"
        >
          <CheckCircle2
            size={15}
          />

          <span>
            {generationMessage}
          </span>
        </div>
      )}


      {generationError && (
        <div
          className="insights-message error"
          role="alert"
          data-export-hide="true"
        >
          <AlertTriangle
            size={15}
          />

          <span>
            {generationError}
          </span>
        </div>
      )}


      {exportError && (
        <div
          className="insights-export-error"
          data-export-hide="true"
        >
          {exportError}
        </div>
      )}


      <section className="insights-panel">
        <div
          className="insights-toolbar"
          data-export-hide="true"
        >
          <div className="insights-search">
            <Search
              size={15}
            />

            <input
              type="search"
              value={search}
              onChange={(
                event,
              ) =>
                setSearch(
                  event
                    .target
                    .value,
                )
              }
              placeholder="Buscar insights..."
              aria-label="Buscar insights"
            />
          </div>


          <select
            value={
              statusFilter
            }
            onChange={(
              event,
            ) =>
              setStatusFilter(
                event
                  .target
                  .value,
              )
            }
            aria-label="Filtrar por estado"
          >
            <option value="all">
              Todos los estados
            </option>

            {statusOptions.map(
              (status) => (
                <option
                  key={
                    status
                  }
                  value={
                    status
                  }
                >
                  {status}
                </option>
              ),
            )}
          </select>


          <select
            value={
              severityFilter
            }
            onChange={(
              event,
            ) =>
              setSeverityFilter(
                event
                  .target
                  .value,
              )
            }
            aria-label="Filtrar por severidad"
          >
            <option value="all">
              Todas las severidades
            </option>

            {severityOptions.map(
              (
                severity,
              ) => (
                <option
                  key={
                    severity
                  }
                  value={
                    severity
                  }
                >
                  {severity}
                </option>
              ),
            )}
          </select>


          <div className="insights-result-count">
            {filteredInsights.length}
            {" "}
            de
            {" "}
            {insights.length}
          </div>
        </div>


        {loading ? (
          <div className="insights-loading">
            <div className="insights-spinner" />

            <strong>
              Cargando insights
            </strong>
          </div>
        ) : error ? (
          <div
            className="insights-state-error"
            role="alert"
          >
            <AlertTriangle
              size={22}
            />

            <strong>
              No se pudieron cargar los insights
            </strong>

            <p>
              {error}
            </p>
          </div>
        ) : insights.length === 0 ? (
          <div className="insights-empty">
            <div className="insights-empty-icon">
              <Database
                size={25}
              />
            </div>

            <strong>
              No hay insights registrados
            </strong>

            <p>
              Ejecuta el análisis para detectar
              nuevas observaciones en los datos.
            </p>
          </div>
        ) : filteredInsights.length === 0 ? (
          <div className="insights-empty compact">
            <div className="insights-empty-icon">
              <Search
                size={23}
              />
            </div>

            <strong>
              Sin coincidencias
            </strong>

            <p>
              Modifica la búsqueda o los filtros.
            </p>
          </div>
        ) : (
          <div className="insights-list">
            {filteredInsights.map(
              (
                insight,
              ) => {
                const evidenceEntries =
                  insight.evidence
                    ? Object.entries(
                        insight
                          .evidence,
                      )
                    : [];

                return (
                  <article
                    key={
                      insight.id
                    }
                    className="insight-card"
                  >
                    <div className="insight-card-accent" />


                    <div className="insight-card-header">
                      <div className="insight-card-heading">
                        <div className="insight-card-icon">
                          <Lightbulb
                            size={18}
                          />
                        </div>

                        <div>
                          <div className="insight-card-tags">
                            {insight.insight_type && (
                              <span className="insight-type">
                                {
                                  translateInsightType(
                                    insight
                                      .insight_type,
                                  )
                                }
                              </span>
                            )}

                            {insight.severity && (
                              <span
                                className={
                                  severityClass(
                                    insight
                                      .severity,
                                  )
                                }
                              >
                                {
                                  translateSeverity(
                                    insight
                                      .severity,
                                  )
                                }
                              </span>
                            )}
                          </div>

                          <h2>
                            {
                              insight
                                .title
                            }
                          </h2>
                        </div>
                      </div>


                      <span
                        className={
                          statusClass(
                            insight
                              .status,
                          )
                        }
                      >
                        {
                          translateStatus(
                            insight
                              .status,
                          )
                        }
                      </span>
                    </div>


                    <p className="insight-description">
                      {
                        insight
                          .description
                      }
                    </p>


                    {evidenceEntries.length >
                      0 && (
                      <section className="insight-evidence">
                        <div className="insight-evidence-title">
                          Evidencia
                        </div>

                        <div className="insight-evidence-grid">
                          {evidenceEntries.map(
                            ([
                              key,
                              value,
                            ]) => (
                              <div
                                key={
                                  key
                                }
                                className="insight-evidence-item"
                              >
                                <span>
                                  {formatEvidenceKey(
                                    key,
                                  )}
                                </span>

                                <strong>
                                  {formatEvidenceValue(
                                    value,
                                  )}
                                </strong>
                              </div>
                            ),
                          )}
                        </div>
                      </section>
                    )}


                    <footer className="insight-card-footer">
                      <Clock3
                        size={13}
                      />

                      <span>
                        {formatDate(
                          insight
                            .created_at,
                        )}
                      </span>
                    </footer>
                  </article>
                );
              },
            )}
          </div>
        )}
      </section>
    </section>
  );
}
