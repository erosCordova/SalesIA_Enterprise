import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Activity,
  BarChart3,
  CalendarDays,
  ChartNoAxesCombined,
  CircleAlert,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import {
  Area,
  CartesianGrid,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import ExportActions from "../../components/ui/ExportActions";
import ModuleState from "../../components/ui/ModuleState";

import {
  getSalesForecast,
} from "../../services/forecasting.service";

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
  SalesForecastResponse,
} from "../../types/forecasting";

import "./probabilidad-commercial.css";


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


function formatNumber(
  value: number,
  digits = 0,
) {
  return new Intl.NumberFormat(
    "es-PE",
    {
      maximumFractionDigits:
        digits,
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
    },
  ).format(
    date,
  );
}


export default function ProbabilidadPage() {
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
    horizonDays,
    setHorizonDays,
  ] =
    useState(30);

  const [
    historyDays,
    setHistoryDays,
  ] =
    useState(90);

  const [
    forecast,
    setForecast,
  ] =
    useState<
      SalesForecastResponse
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
          branchesResource
            .data
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


  async function loadForecast(
    selectedBranch =
      branchId,

    selectedHorizon =
      horizonDays,

    selectedHistory =
      historyDays,
  ) {
    setLoading(
      true,
    );

    setError("");

    try {
      const response =
        await getSalesForecast({
          horizonDays:
            selectedHorizon,

          historyDays:
            selectedHistory,

          branchId:
            selectedBranch
            || undefined,
        });

      setForecast(
        response,
      );
    } catch (
      currentError
    ) {
      setForecast(
        null,
      );

      setError(
        currentError
          instanceof Error
          ? currentError.message
          : "No se pudo generar el pronóstico.",
      );
    } finally {
      setLoading(
        false,
      );
    }
  }


  useEffect(
    () => {
      void loadForecast(
        "",
        30,
        90,
      );
    },
    [],
  );


  const chartData =
    useMemo(
      () => {
        if (!forecast) {
          return [];
        }

        const historical =
          forecast.historical.map(
            (point) => ({
              date:
                point.date,

              label:
                formatDate(
                  point.date,
                ),

              actual:
                point.revenue,

              projected:
                null as
                  number
                  | null,

              type:
                "history",
            }),
          );

        const future =
          forecast.forecast.map(
            (point) => ({
              date:
                point.date,

              label:
                formatDate(
                  point.date,
                ),

              actual:
                null as
                  number
                  | null,

              projected:
                point.revenue,

              type:
                "forecast",
            }),
          );

        if (
          historical.length > 0
          && future.length > 0
        ) {
          const last =
            historical[
              historical.length - 1
            ];

          future.unshift({
            date:
              last.date,

            label:
              last.label,

            actual:
              null,

            projected:
              last.actual,

            type:
              "bridge",
          });
        }

        return [
          ...historical,
          ...future,
        ];
      },
      [
        forecast,
      ],
    );


  const TrendIcon =
    forecast
      ?.trend_direction ===
      "Crecimiento"
      ? TrendingUp
      : forecast
          ?.trend_direction ===
          "Descenso"
        ? TrendingDown
        : Activity;


  const trendClass =
    forecast
      ?.trend_direction ===
      "Crecimiento"
      ? "positive"
      : forecast
          ?.trend_direction ===
          "Descenso"
        ? "negative"
        : "neutral";


  function exportRows():
    ExportRow[] {
    if (!forecast) {
      return [];
    }

    return forecast.forecast.map(
      (point) => ({
        Fecha:
          formatDate(
            point.date,
          ),

        Sucursal:
          forecast.branch_name,

        "Ingreso estimado":
          point.revenue,

        "Ventas estimadas":
          point.sales,
      }),
    );
  }


  function exportFilename() {
    return `pronostico-${exportDateStamp()}`;
  }


  async function handlePdf() {
    if (
      !exportRef.current
      || !forecast
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
    if (!forecast) {
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
    if (!forecast) {
      return;
    }

    setExportError("");

    try {
      await exportRowsToExcel(
        exportFilename(),
        "Pronósticos",
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
      || !forecast
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
        "Pronóstico comercial - SalesIA",
        "Proyección de ventas basada en el historial registrado.",
      );
    } catch (
      currentError
    ) {
      setExportError(
        currentError
          instanceof Error
          ? currentError.message
          : "No se pudo compartir el pronóstico.",
      );
    }
  }


  return (
    <section
      ref={exportRef}
      className="forecast-page"
    >
      <header className="forecast-header">
        <div>
          <div className="forecast-eyebrow">
            <ChartNoAxesCombined
              size={15}
            />

            Inteligencia comercial
          </div>

          <h1>
            Pronósticos
          </h1>

          <p>
            Estima el comportamiento futuro de las ventas utilizando el historial real registrado en SalesIA.
          </p>
        </div>

        <div
          className="forecast-header-actions"
          data-export-hide="true"
        >
          {forecast && (
            <ExportActions
              disabled={
                loading
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
          )}

          <button
            type="button"
            className="forecast-refresh"
            disabled={
              loading
            }
            onClick={() =>
              void loadForecast()
            }
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? "forecast-spin"
                  : ""
              }
            />

            Actualizar
          </button>
        </div>
      </header>


      <section
        className="forecast-filters"
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

        <label>
          <span>
            Pronosticar
          </span>

          <select
            value={
              horizonDays
            }
            onChange={(
              event,
            ) =>
              setHorizonDays(
                Number(
                  event.target
                    .value,
                ),
              )
            }
          >
            <option value={7}>
              Próximos 7 días
            </option>

            <option value={30}>
              Próximos 30 días
            </option>

            <option value={60}>
              Próximos 60 días
            </option>

            <option value={90}>
              Próximos 90 días
            </option>
          </select>
        </label>

        <label>
          <span>
            Historial usado
          </span>

          <select
            value={
              historyDays
            }
            onChange={(
              event,
            ) =>
              setHistoryDays(
                Number(
                  event.target
                    .value,
                ),
              )
            }
          >
            <option value={30}>
              Últimos 30 días
            </option>

            <option value={60}>
              Últimos 60 días
            </option>

            <option value={90}>
              Últimos 90 días
            </option>

            <option value={180}>
              Últimos 180 días
            </option>

            <option value={365}>
              Últimos 365 días
            </option>
          </select>
        </label>

        <button
          type="button"
          className="forecast-generate"
          disabled={
            loading
          }
          onClick={() =>
            void loadForecast()
          }
        >
          <Sparkles
            size={16}
          />

          {loading
            ? "Calculando..."
            : "Generar pronóstico"}
        </button>
      </section>


      {error && (
        <ModuleState
          type="error"
          title="No se pudo generar el pronóstico"
          description={
            error
          }
        />
      )}

      {exportError && (
        <div className="forecast-error">
          {exportError}
        </div>
      )}


      {loading &&
      !forecast ? (
        <ModuleState
          type="loading"
          title="Generando pronóstico"
          description="Analizando el historial de ventas..."
        />
      ) : forecast ? (
        <>
          <section className="forecast-kpis">
            <article>
              <div className="forecast-kpi-icon">
                <WalletCards
                  size={18}
                />
              </div>

              <span>
                Ingresos estimados
              </span>

              <strong>
                {formatCurrency(
                  forecast
                    .projected_revenue,
                )}
              </strong>

              <small>
                Próximos{" "}
                {
                  forecast
                    .horizon_days
                }{" "}
                días
              </small>
            </article>

            <article>
              <div className="forecast-kpi-icon">
                <BarChart3
                  size={18}
                />
              </div>

              <span>
                Ventas estimadas
              </span>

              <strong>
                {formatNumber(
                  forecast
                    .projected_sales,
                  1,
                )}
              </strong>

              <small>
                Operaciones aproximadas
              </small>
            </article>

            <article>
              <div className="forecast-kpi-icon">
                <CalendarDays
                  size={18}
                />
              </div>

              <span>
                Rango esperado
              </span>

              <strong className="forecast-range">
                {formatCurrency(
                  forecast
                    .lower_bound,
                )}
                {" – "}
                {formatCurrency(
                  forecast
                    .upper_bound,
                )}
              </strong>

              <small>
                Intervalo orientativo
              </small>
            </article>

            <article>
              <div className="forecast-kpi-icon">
                <Activity
                  size={18}
                />
              </div>

              <span>
                Confianza
              </span>

              <strong>
                {
                  forecast
                    .confidence_label
                }
              </strong>

              <small>
                {formatNumber(
                  forecast
                    .confidence_score,
                  1,
                )}
                % de calidad orientativa
              </small>
            </article>
          </section>


          <section className="forecast-summary">
            <div className="forecast-summary-icon">
              <TrendIcon
                size={23}
              />
            </div>

            <div>
              <span>
                LECTURA DEL PRONÓSTICO
              </span>

              <h2>
                Tendencia{" "}
                {
                  forecast
                    .trend_direction
                    .toLowerCase()
                }
              </h2>

              <p>
                {
                  forecast
                    .interpretation
                }
              </p>
            </div>

            <div
              className={`forecast-trend ${trendClass}`}
            >
              <TrendIcon
                size={17}
              />

              <strong>
                {forecast
                  .trend_percent >
                0
                  ? "+"
                  : ""}
                {formatNumber(
                  forecast
                    .trend_percent,
                  1,
                )}
                %
              </strong>

              <span>
                vs. promedio histórico
              </span>
            </div>
          </section>


          <section className="forecast-main-grid">
            <article className="forecast-panel">
              <header className="forecast-panel-header">
                <div>
                  <span>
                    PROYECCIÓN
                  </span>

                  <h2>
                    Evolución esperada de ingresos
                  </h2>

                  <p>
                    Datos históricos y estimación para los próximos días.
                  </p>
                </div>

                <div className="forecast-legend">
                  <span>
                    <i className="actual" />
                    Histórico
                  </span>

                  <span>
                    <i className="future" />
                    Pronóstico
                  </span>
                </div>
              </header>

              <div className="forecast-chart">
                {chartData.length >
                0 ? (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <ComposedChart
                      data={
                        chartData
                      }
                      margin={{
                        top: 12,
                        right: 12,
                        left: 4,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid
                        vertical={
                          false
                        }
                        stroke="#e8eef5"
                        strokeDasharray="4 4"
                      />

                      <XAxis
                        dataKey="label"
                        axisLine={
                          false
                        }
                        tickLine={
                          false
                        }
                        minTickGap={
                          24
                        }
                        tick={{
                          fill:
                            "#64748b",
                          fontSize:
                            10,
                        }}
                      />

                      <YAxis
                        axisLine={
                          false
                        }
                        tickLine={
                          false
                        }
                        width={70}
                        tick={{
                          fill:
                            "#64748b",
                          fontSize:
                            10,
                        }}
                        tickFormatter={(
                          value,
                        ) =>
                          `S/ ${formatNumber(
                            value,
                            0,
                          )}`
                        }
                      />

                      <Tooltip
                        contentStyle={{
                          border:
                            "1px solid #dbe5ee",
                          borderRadius:
                            10,
                          boxShadow:
                            "0 10px 28px rgba(15,23,42,.08)",
                        }}
                        formatter={(
                          value,
                          name,
                        ) => [
                          formatCurrency(
                            Number(
                              value,
                            ),
                          ),

                          name ===
                          "actual"
                            ? "Histórico"
                            : "Pronóstico",
                        ]}
                      />

                      <Area
                        type="monotone"
                        dataKey="actual"
                        name="actual"
                        stroke="#0b7184"
                        fill="#eaf9fb"
                        fillOpacity={
                          0.45
                        }
                        strokeWidth={
                          2.5
                        }
                        connectNulls={
                          false
                        }
                      />

                      <Line
                        type="monotone"
                        dataKey="projected"
                        name="projected"
                        stroke="#2563eb"
                        strokeWidth={
                          2.5
                        }
                        strokeDasharray="6 4"
                        dot={
                          false
                        }
                        connectNulls={
                          true
                        }
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="forecast-empty">
                    Sin datos suficientes.
                  </div>
                )}
              </div>
            </article>


            <aside className="forecast-panel forecast-reading">
              <header className="forecast-panel-header">
                <div>
                  <span>
                    BASE DEL CÁLCULO
                  </span>

                  <h2>
                    Calidad de los datos
                  </h2>
                </div>

                <CircleAlert
                  size={19}
                />
              </header>

              <div className="forecast-reading-list">
                <div>
                  <span>
                    Sucursal
                  </span>

                  <strong>
                    {
                      forecast
                        .branch_name
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Días observados
                  </span>

                  <strong>
                    {
                      forecast
                        .observed_days
                    }
                  </strong>

                  <small>
                    {
                      forecast
                        .active_days
                    }{" "}
                    con ventas
                  </small>
                </div>

                <div>
                  <span>
                    Ventas históricas
                  </span>

                  <strong>
                    {
                      forecast
                        .historical_sales
                    }
                  </strong>

                  <small>
                    {formatCurrency(
                      forecast
                        .historical_revenue,
                    )}
                    {" "}
                    registrados
                  </small>
                </div>

                <div>
                  <span>
                    Promedio diario
                  </span>

                  <strong>
                    {formatCurrency(
                      forecast
                        .average_daily_revenue,
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Ticket promedio
                  </span>

                  <strong>
                    {formatCurrency(
                      forecast
                        .average_ticket,
                    )}
                  </strong>
                </div>
              </div>
            </aside>
          </section>


          <details className="forecast-method">
            <summary>
              ¿Cómo se calcula este pronóstico?
            </summary>

            <div>
              <p>
                SalesIA analiza los ingresos diarios registrados en el periodo histórico seleccionado y calcula una tendencia estadística lineal. Esa tendencia se proyecta hacia los días futuros.
              </p>

              <p>
                <strong>
                  Modelo:
                </strong>
                {" "}
                {
                  forecast
                    .model_name
                }.
              </p>

              <p>
                El rango esperado se calcula considerando la variación observada en los datos históricos. La confianza mostrada es un indicador orientativo basado en cantidad de información, actividad y estabilidad del historial.
              </p>

              <p className="forecast-warning">
                El pronóstico es una estimación estadística y no garantiza ventas futuras.
              </p>
            </div>
          </details>
        </>
      ) : null}
    </section>
  );
}
