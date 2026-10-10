import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BellRing,
  CircleCheckBig,
  Info,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Store,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import ExportActions from "../../components/ui/ExportActions";
import ModuleState from "../../components/ui/ModuleState";

import {
  getBusinessInsights,
} from "../../services/business-insights.service";

import {
  getBranches,
} from "../../services/organization.service";

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
  BusinessInsight,
  BusinessInsightCategory,
  BusinessInsightsResponse,
} from "../../types/business-insights";

import "./insights-commercial.css";


type InsightFilter =
  | "all"
  | BusinessInsightCategory;


function formatCurrency(
  value: number,
) {
  return new Intl.NumberFormat(
    "es-PE",
    {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(
    value,
  );
}


function formatDate(
  value: string,
) {
  const date =
    new Date(
      `${value}T00:00:00`,
    );

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
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(
    date,
  );
}


function formatDateTime(
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
  ).format(
    date,
  );
}


function categoryLabel(
  category:
    BusinessInsightCategory,
) {
  const labels:
    Record<
      BusinessInsightCategory,
      string
    > = {
      attention:
        "Requiere atención",

      opportunity:
        "Oportunidad",

      trend:
        "Tendencia",

      info:
        "Información",
    };

  return labels[
    category
  ];
}


function categoryIcon(
  category:
    BusinessInsightCategory,
) {
  switch (
    category
  ) {
    case "attention":
      return AlertTriangle;

    case "opportunity":
      return TrendingUp;

    case "trend":
      return Activity;

    default:
      return Info;
  }
}


function severityLabel(
  severity: string,
) {
  switch (
    severity
  ) {
    case "high":
      return "Prioridad alta";

    case "medium":
      return "Prioridad media";

    default:
      return "Informativo";
  }
}


function insightPriority(
  insight:
    BusinessInsight,
) {
  const categoryWeight = {
    attention: 0,
    opportunity: 1,
    trend: 2,
    info: 3,
  };

  const severityWeight = {
    high: 0,
    medium: 1,
    low: 2,
  };

  return (
    categoryWeight[
      insight.category
    ] * 10
    + severityWeight[
      insight.severity
    ]
  );
}


export default function InsightsPage() {
  const exportRef =
    useRef<HTMLElement>(
      null,
    );

  const branchesResource =
    useApiResource(
      getBranches,
    );

  const [
    branchId,
    setBranchId,
  ] =
    useState("");

  const [
    filter,
    setFilter,
  ] =
    useState<InsightFilter>(
      "all",
    );

  const [
    response,
    setResponse,
  ] =
    useState<
      BusinessInsightsResponse
      | null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    exportError,
    setExportError,
  ] =
    useState("");


  const branches =
    useMemo(
      () =>
        (
          branchesResource.data
          ?? []
        ).filter(
          (branch) =>
            branch.status ===
            "active",
        ),
      [
        branchesResource.data,
      ],
    );


  async function loadInsights(
    selectedBranch =
      branchId,
  ) {
    setLoading(
      true,
    );

    setError("");

    try {
      const result =
        await getBusinessInsights(
          selectedBranch
          || undefined,
        );

      setResponse(
        result,
      );
    } catch (
      currentError
    ) {
      setResponse(
        null,
      );

      setError(
        currentError
          instanceof Error
          ? currentError.message
          : "No se pudieron generar los insights.",
      );
    } finally {
      setLoading(
        false,
      );
    }
  }


  useEffect(
    () => {
      void loadInsights(
        "",
      );
    },
    [],
  );


  const insights =
    useMemo(
      () =>
        [
          ...(
            response
              ?.insights
            ?? []
          ),
        ].sort(
          (
            left,
            right,
          ) =>
            insightPriority(
              left,
            )
            - insightPriority(
              right,
            ),
        ),
      [
        response,
      ],
    );


  const filteredInsights =
    useMemo(
      () =>
        filter === "all"
          ? insights
          : insights.filter(
              (insight) =>
                insight.category
                === filter,
            ),
      [
        filter,
        insights,
      ],
    );


  const attentionCount =
    insights.filter(
      (insight) =>
        insight.category
        === "attention",
    ).length;

  const opportunityCount =
    insights.filter(
      (insight) =>
        insight.category
        === "opportunity",
    ).length;

  const trendCount =
    insights.filter(
      (insight) =>
        insight.category
        === "trend"
        || insight.category
        === "info",
    ).length;


  const mainInsight =
    insights[0]
    ?? null;


  function exportRows():
    ExportRow[] {
    return filteredInsights.map(
      (insight) => ({
        Categoría:
          categoryLabel(
            insight.category,
          ),

        Prioridad:
          severityLabel(
            insight.severity,
          ),

        Título:
          insight.title,

        Descripción:
          insight.description,

        Motivo:
          insight.reason,

        Acción:
          insight.action_label,

        Sucursal:
          response
            ?.branch_name
          ?? "",
      }),
    );
  }


  function exportFilename() {
    return `insights-${exportDateStamp()}`;
  }


  async function handlePdf() {
    if (
      !exportRef.current
      || filteredInsights
          .length === 0
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
      filteredInsights
        .length === 0
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
      filteredInsights
        .length === 0
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
        currentError
          instanceof Error
          ? currentError.message
          : "No se pudo generar el Excel.",
      );
    }
  }


  async function handleShare() {
    if (
      !exportRef.current
      || filteredInsights
          .length === 0
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
        "Insights empresariales - SalesIA",
        "Hallazgos detectados a partir de los datos comerciales.",
      );
    } catch (
      currentError
    ) {
      setExportError(
        currentError
          instanceof Error
          ? currentError.message
          : "No se pudieron compartir los insights.",
      );
    }
  }


  return (
    <section
      ref={exportRef}
      className="business-insights-page"
    >
      <header className="business-insights-header">
        <div>
          <div className="business-insights-eyebrow">
            <Lightbulb
              size={15}
            />

            Inteligencia comercial
          </div>

          <h1>
            Insights
          </h1>

          <p>
            SalesIA revisa tus datos y destaca situaciones que merecen atención, oportunidades y tendencias relevantes.
          </p>
        </div>

        <div
          className="business-insights-header-actions"
          data-export-hide="true"
        >
          <ExportActions
            disabled={
              loading
              || filteredInsights
                  .length === 0
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
            className="business-insights-refresh"
            disabled={
              loading
            }
            onClick={() =>
              void loadInsights()
            }
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? "business-insights-spin"
                  : ""
              }
            />

            {loading
              ? "Analizando..."
              : "Analizar ahora"}
          </button>
        </div>
      </header>


      <section
        className="business-insights-controls"
        data-export-hide="true"
      >
        <label>
          <span>
            Sucursal
          </span>

          <select
            value={
              branchId
            }
            disabled={
              branchesResource
                .loading
            }
            onChange={(
              event,
            ) =>
              setBranchId(
                event.target.value,
              )
            }
          >
            <option value="">
              Todas las sucursales
            </option>

            {branches.map(
              (branch) => (
                <option
                  key={
                    branch.id
                  }
                  value={
                    branch.id
                  }
                >
                  {branch.name}
                </option>
              ),
            )}
          </select>
        </label>

        <div className="business-insights-period">
          <span>
            Periodo analizado
          </span>

          <strong>
            Últimos 7 días
          </strong>

          <small>
            Comparado con los 7 anteriores
          </small>
        </div>

        <button
          type="button"
          className="business-insights-apply"
          disabled={
            loading
          }
          onClick={() =>
            void loadInsights()
          }
        >
          <Sparkles
            size={16}
          />

          Aplicar
        </button>
      </section>


      {error && (
        <ModuleState
          type="error"
          title="No se pudieron analizar los datos"
          description={
            error
          }
        />
      )}

      {exportError && (
        <div className="business-insights-error">
          {exportError}
        </div>
      )}


      {loading &&
      !response ? (
        <ModuleState
          type="loading"
          title="Analizando el negocio"
          description="SalesIA está revisando ventas, comportamiento estadístico y pronósticos..."
        />
      ) : response ? (
        <>
          <section className="business-insights-kpis">
            <article>
              <div className="business-insights-kpi-icon">
                <Lightbulb
                  size={18}
                />
              </div>

              <span>
                Hallazgos
              </span>

              <strong>
                {
                  insights.length
                }
              </strong>

              <small>
                Situaciones detectadas
              </small>
            </article>

            <article>
              <div className="business-insights-kpi-icon attention">
                <BellRing
                  size={18}
                />
              </div>

              <span>
                Requieren atención
              </span>

              <strong>
                {
                  attentionCount
                }
              </strong>

              <small>
                Conviene revisarlos
              </small>
            </article>

            <article>
              <div className="business-insights-kpi-icon opportunity">
                <TrendingUp
                  size={18}
                />
              </div>

              <span>
                Oportunidades
              </span>

              <strong>
                {
                  opportunityCount
                }
              </strong>

              <small>
                Señales positivas
              </small>
            </article>

            <article>
              <div className="business-insights-kpi-icon">
                <WalletCards
                  size={18}
                />
              </div>

              <span>
                Ingresos recientes
              </span>

              <strong>
                {formatCurrency(
                  response
                    .current_revenue,
                )}
              </strong>

              <small>
                {
                  response
                    .current_sales
                }{" "}
                ventas en 7 días
              </small>
            </article>
          </section>


          {mainInsight && (
            <section
              className={
                `business-insights-highlight ${mainInsight.category}`
              }
            >
              <div className="business-insights-highlight-icon">
                {(() => {
                  const Icon =
                    categoryIcon(
                      mainInsight
                        .category,
                    );

                  return (
                    <Icon
                      size={23}
                    />
                  );
                })()}
              </div>

              <div>
                <span>
                  PRINCIPAL HALLAZGO
                </span>

                <h2>
                  {
                    mainInsight
                      .title
                  }
                </h2>

                <p>
                  {
                    mainInsight
                      .description
                  }
                </p>
              </div>

              <Link
                to={
                  mainInsight
                    .action_path
                }
                className="business-insights-highlight-action"
                data-export-hide="true"
              >
                {
                  mainInsight
                    .action_label
                }

                <ArrowRight
                  size={15}
                />
              </Link>
            </section>
          )}


          <section
            className="business-insights-filter-bar"
            data-export-hide="true"
          >
            <button
              type="button"
              className={
                filter === "all"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter(
                  "all",
                )
              }
            >
              Todos
              <span>
                {
                  insights.length
                }
              </span>
            </button>

            <button
              type="button"
              className={
                filter ===
                "attention"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter(
                  "attention",
                )
              }
            >
              Atención
              <span>
                {
                  attentionCount
                }
              </span>
            </button>

            <button
              type="button"
              className={
                filter ===
                "opportunity"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter(
                  "opportunity",
                )
              }
            >
              Oportunidades
              <span>
                {
                  opportunityCount
                }
              </span>
            </button>

            <button
              type="button"
              className={
                filter === "trend"
                  || filter === "info"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter(
                  "trend",
                )
              }
            >
              Tendencias
              <span>
                {
                  trendCount
                }
              </span>
            </button>
          </section>


          {filteredInsights.length ===
          0 ? (
            <ModuleState
              type="empty"
              title="No hay hallazgos en esta categoría"
              description="Selecciona otro filtro para consultar los demás insights."
            />
          ) : (
            <section className="business-insights-list">
              {filteredInsights.map(
                (insight) => {
                  const Icon =
                    categoryIcon(
                      insight.category,
                    );

                  return (
                    <article
                      key={
                        insight.id
                      }
                      className={
                        `business-insight-card ${insight.category}`
                      }
                    >
                      <div className="business-insight-card-top">
                        <div className="business-insight-card-heading">
                          <div
                            className={
                              `business-insight-card-icon ${insight.category}`
                            }
                          >
                            <Icon
                              size={19}
                            />
                          </div>

                          <div>
                            <div className="business-insight-tags">
                              <span
                                className={
                                  `business-insight-category ${insight.category}`
                                }
                              >
                                {
                                  categoryLabel(
                                    insight.category,
                                  )
                                }
                              </span>

                              <span
                                className={
                                  `business-insight-severity ${insight.severity}`
                                }
                              >
                                {
                                  severityLabel(
                                    insight.severity,
                                  )
                                }
                              </span>
                            </div>

                            <h2>
                              {
                                insight.title
                              }
                            </h2>
                          </div>
                        </div>
                      </div>


                      <p className="business-insight-description">
                        {
                          insight
                            .description
                        }
                      </p>


                      <div className="business-insight-reason">
                        <strong>
                          ¿Por qué importa?
                        </strong>

                        <p>
                          {
                            insight.reason
                          }
                        </p>
                      </div>


                      {insight.metrics.length >
                        0 && (
                        <div className="business-insight-metrics">
                          {insight.metrics.map(
                            (metric) => (
                              <div
                                key={
                                  metric.label
                                }
                              >
                                <span>
                                  {
                                    metric
                                      .label
                                  }
                                </span>

                                <strong>
                                  {
                                    metric
                                      .value
                                  }
                                </strong>
                              </div>
                            ),
                          )}
                        </div>
                      )}


                      <footer className="business-insight-footer">
                        <Link
                          to={
                            insight
                              .action_path
                          }
                          className="business-insight-action"
                          data-export-hide="true"
                        >
                          {
                            insight
                              .action_label
                          }

                          <ArrowRight
                            size={14}
                          />
                        </Link>
                      </footer>
                    </article>
                  );
                },
              )}
            </section>
          )}


          <section className="business-insights-context">
            <div>
              <Store
                size={18}
              />

              <span>
                Sucursal
              </span>

              <strong>
                {
                  response
                    .branch_name
                }
              </strong>
            </div>

            <div>
              <Activity
                size={18}
              />

              <span>
                Días con ventas
              </span>

              <strong>
                {
                  response
                    .active_days
                }
                {" de 7"}
              </strong>
            </div>

            <div>
              <WalletCards
                size={18}
              />

              <span>
                Ticket promedio
              </span>

              <strong>
                {formatCurrency(
                  response
                    .current_average_ticket,
                )}
              </strong>
            </div>

            <div>
              <CircleCheckBig
                size={18}
              />

              <span>
                Actualizado
              </span>

              <strong>
                {formatDateTime(
                  response
                    .generated_at,
                )}
              </strong>
            </div>
          </section>


          <details className="business-insights-method">
            <summary>
              ¿Cómo obtiene SalesIA estos insights?
            </summary>

            <div>
              <p>
                SalesIA compara los últimos 7 días con los 7 días anteriores y revisa ingresos, cantidad de ventas, ticket promedio, días con actividad y concentración de los ingresos.
              </p>

              <p>
                También utiliza la variabilidad de las ventas y la calidad del pronóstico comercial para detectar situaciones que pueden ser útiles para la toma de decisiones.
              </p>

              <p>
                Los insights son reglas analíticas sobre datos reales. No representan una garantía de resultados futuros y deben utilizarse como apoyo para investigar el negocio.
              </p>

              <p>
                Periodo actual:{" "}
                <strong>
                  {formatDate(
                    response
                      .period_start,
                  )}
                  {" – "}
                  {formatDate(
                    response
                      .period_end,
                  )}
                </strong>
              </p>
            </div>
          </details>
        </>
      ) : null}
    </section>
  );
}
