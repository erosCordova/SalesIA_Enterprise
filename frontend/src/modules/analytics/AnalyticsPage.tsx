import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  BarChart3,
  CalendarRange,
  ReceiptText,
  RefreshCw,
  ShoppingBag,
  Sigma,
  Sparkles,
  Trophy,
} from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import ExportActions from "../../components/ui/ExportActions";

import {
  analyzeSalesStatistics,
  getAnalyticsDashboard,
} from "../../services/analytics.service";

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
  AnalyticsDashboardResponse,
  SalesStatisticsResponse,
} from "../../types/analytics";

import "./analytics-commercial.css";


type ChartMetric =
  | "revenue"
  | "sales";


interface ChangeInfo {
  value: number | null;
  label: string;
  direction:
    | "positive"
    | "negative"
    | "neutral";
}


function inputDate(
  date: Date,
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(
      2,
      "0",
    );

  const day =
    String(
      date.getDate(),
    ).padStart(
      2,
      "0",
    );

  return `${year}-${month}-${day}`;
}


function dateOffset(
  offset: number,
) {
  const date =
    new Date();

  date.setDate(
    date.getDate() + offset,
  );

  return inputDate(
    date,
  );
}


function parseDate(
  value: string,
) {
  return new Date(
    `${value}T00:00:00`,
  );
}


function daysInclusive(
  start: string,
  end: string,
) {
  const startDate =
    parseDate(start);

  const endDate =
    parseDate(end);

  const difference =
    endDate.getTime()
    - startDate.getTime();

  return Math.max(
    1,
    Math.floor(
      difference /
        86_400_000,
    ) + 1,
  );
}


function previousPeriod(
  start: string,
  end: string,
) {
  const days =
    daysInclusive(
      start,
      end,
    );

  const previousEnd =
    parseDate(start);

  previousEnd.setDate(
    previousEnd.getDate() - 1,
  );

  const previousStart =
    new Date(
      previousEnd,
    );

  previousStart.setDate(
    previousStart.getDate()
      - (days - 1),
  );

  return {
    start:
      inputDate(
        previousStart,
      ),

    end:
      inputDate(
        previousEnd,
      ),
  };
}


function numberValue(
  value: unknown,
) {
  const parsed =
    Number(value);

  return Number.isFinite(
    parsed,
  )
    ? parsed
    : 0;
}


function formatCurrency(
  value: unknown,
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
    numberValue(value),
  );
}


function formatNumber(
  value: unknown,
  digits = 0,
) {
  return new Intl.NumberFormat(
    "es-PE",
    {
      maximumFractionDigits:
        digits,
    },
  ).format(
    numberValue(value),
  );
}


function formatPercent(
  value: number,
) {
  return new Intl.NumberFormat(
    "es-PE",
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    },
  ).format(
    Math.abs(value),
  );
}


function formatDate(
  value: string,
) {
  const date =
    parseDate(value);

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


function formatChartDate(
  value: string,
) {
  const date =
    parseDate(value);

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


function calculateChange(
  current: number,
  previous: number,
): ChangeInfo {
  if (
    previous === 0
  ) {
    return {
      value: null,
      label:
        current === 0
          ? "Sin cambios"
          : "Sin base comparable",
      direction:
        "neutral",
    };
  }

  const value =
    (
      (
        current
        - previous
      )
      /
      Math.abs(
        previous,
      )
    )
    * 100;

  if (
    Math.abs(value) < 0.05
  ) {
    return {
      value: 0,
      label:
        "Sin cambios",
      direction:
        "neutral",
    };
  }

  return {
    value,
    label:
      `${formatPercent(
        value,
      )}% vs. periodo anterior`,
    direction:
      value > 0
        ? "positive"
        : "negative",
  };
}


const INITIAL_START =
  dateOffset(-29);

const INITIAL_END =
  dateOffset(0);


export default function AnalyticsPage() {
  const exportRef =
    useRef<HTMLElement>(
      null,
    );

  const [
    startDate,
    setStartDate,
  ] =
    useState(
      INITIAL_START,
    );

  const [
    endDate,
    setEndDate,
  ] =
    useState(
      INITIAL_END,
    );

  const [
    periodOption,
    setPeriodOption,
  ] =
    useState("30");

  const [
    chartMetric,
    setChartMetric,
  ] =
    useState<ChartMetric>(
      "revenue",
    );

  const [
    dashboard,
    setDashboard,
  ] =
    useState<
      AnalyticsDashboardResponse
      | null
    >(null);

  const [
    previousDashboard,
    setPreviousDashboard,
  ] =
    useState<
      AnalyticsDashboardResponse
      | null
    >(null);

  const [
    salesAnalysis,
    setSalesAnalysis,
  ] =
    useState<
      SalesStatisticsResponse
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


  async function loadAnalytics(
    rangeStart =
      startDate,

    rangeEnd =
      endDate,
  ) {
    setError("");

    if (
      !rangeStart
      || !rangeEnd
    ) {
      setError(
        "Selecciona las fechas del periodo.",
      );

      return;
    }

    if (
      rangeStart
      > rangeEnd
    ) {
      setError(
        "La fecha inicial no puede ser posterior a la fecha final.",
      );

      return;
    }

    const previous =
      previousPeriod(
        rangeStart,
        rangeEnd,
      );

    setLoading(
      true,
    );

    try {
      const [
        currentResponse,
        statisticsResponse,
        previousResponse,
      ] =
        await Promise.all([
          getAnalyticsDashboard(
            rangeStart,
            rangeEnd,
          ),

          analyzeSalesStatistics(
            rangeStart,
            rangeEnd,
          ),

          getAnalyticsDashboard(
            previous.start,
            previous.end,
          ),
        ]);

      setDashboard(
        currentResponse,
      );

      setSalesAnalysis(
        statisticsResponse,
      );

      setPreviousDashboard(
        previousResponse,
      );
    } catch (
      requestError
    ) {
      setError(
        requestError
          instanceof Error
          ? requestError.message
          : "No se pudo cargar el análisis comercial.",
      );
    } finally {
      setLoading(
        false,
      );
    }
  }


  useEffect(
    () => {
      void loadAnalytics(
        INITIAL_START,
        INITIAL_END,
      );
    },
    [],
  );


  function changePeriod(
    value: string,
  ) {
    setPeriodOption(
      value,
    );

    if (
      value ===
      "custom"
    ) {
      return;
    }

    const days =
      Number(value);

    if (
      !Number.isFinite(
        days,
      )
    ) {
      return;
    }

    setStartDate(
      dateOffset(
        -(days - 1),
      ),
    );

    setEndDate(
      dateOffset(0),
    );
  }


  const dailySales =
    useMemo(
      () =>
        dashboard
          ?.daily_sales
        ?? [],
      [
        dashboard,
      ],
    );


  const totalRevenue =
    numberValue(
      dashboard
        ?.summary
        .total_revenue,
    );

  const totalSales =
    numberValue(
      dashboard
        ?.summary
        .total_sales,
    );

  const averageTicket =
    numberValue(
      dashboard
        ?.summary
        .average_ticket,
    );

  const medianTicket =
    numberValue(
      dashboard
        ?.summary
        .median_ticket,
    );


  const previousRevenue =
    numberValue(
      previousDashboard
        ?.summary
        .total_revenue,
    );

  const previousSales =
    numberValue(
      previousDashboard
        ?.summary
        .total_sales,
    );

  const previousAverageTicket =
    numberValue(
      previousDashboard
        ?.summary
        .average_ticket,
    );


  const periodDays =
    daysInclusive(
      startDate,
      endDate,
    );

  const activeDays =
    dailySales.length;

  const averageDailyRevenue =
    totalRevenue
    / periodDays;

  const previousAverageDailyRevenue =
    previousRevenue
    / periodDays;


  const revenueChange =
    calculateChange(
      totalRevenue,
      previousRevenue,
    );

  const salesChange =
    calculateChange(
      totalSales,
      previousSales,
    );

  const ticketChange =
    calculateChange(
      averageTicket,
      previousAverageTicket,
    );

  const dailyChange =
    calculateChange(
      averageDailyRevenue,
      previousAverageDailyRevenue,
    );


  const chartData =
    useMemo(
      () =>
        dailySales.map(
          (item) => ({
            date:
              item.date,

            label:
              formatChartDate(
                item.date,
              ),

            revenue:
              numberValue(
                item.revenue,
              ),

            sales:
              numberValue(
                item.sales_count,
              ),
          }),
        ),
      [
        dailySales,
      ],
    );


  const topDays =
    useMemo(
      () =>
        [
          ...dailySales,
        ]
          .sort(
            (
              left,
              right,
            ) =>
              numberValue(
                right.revenue,
              )
              -
              numberValue(
                left.revenue,
              ),
          )
          .slice(
            0,
            5,
          ),
      [
        dailySales,
      ],
    );


  const bestDay =
    topDays[0]
    ?? null;

  const bestDayRevenue =
    bestDay
      ? numberValue(
          bestDay.revenue,
        )
      : 0;

  const bestDayShare =
    totalRevenue > 0
      ? (
          bestDayRevenue
          /
          totalRevenue
        )
        * 100
      : 0;


  const concentration =
    bestDayShare >= 60
      ? "Alta"
      : bestDayShare >= 35
        ? "Media"
        : "Distribuida";


  const activityRate =
    periodDays > 0
      ? (
          activeDays
          /
          periodDays
        )
        * 100
      : 0;


  const summaryTitle =
    revenueChange.value === null
      ? "Periodo listo para analizar"
      : revenueChange.value > 0
        ? "Los ingresos mejoraron"
        : revenueChange.value < 0
          ? "Los ingresos disminuyeron"
          : "Los ingresos se mantuvieron";


  const summaryText =
    revenueChange.value === null
      ? "Todavía no existe una base suficiente para comparar este periodo con el anterior."
      : revenueChange.value > 0
        ? `Los ingresos crecieron ${formatPercent(
            revenueChange.value,
          )}% frente al periodo anterior.`
        : revenueChange.value < 0
          ? `Los ingresos bajaron ${formatPercent(
              revenueChange.value,
            )}% frente al periodo anterior.`
          : "Los ingresos se mantuvieron prácticamente iguales al periodo anterior.";


  const kpis = [
    {
      label:
        "Ingresos",

      value:
        formatCurrency(
          totalRevenue,
        ),

      description:
        "Total vendido",

      change:
        revenueChange,

      icon:
        Banknote,
    },

    {
      label:
        "Ventas",

      value:
        formatNumber(
          totalSales,
          0,
        ),

      description:
        "Operaciones completadas",

      change:
        salesChange,

      icon:
        ShoppingBag,
    },

    {
      label:
        "Ticket promedio",

      value:
        formatCurrency(
          averageTicket,
        ),

      description:
        "Promedio por venta",

      change:
        ticketChange,

      icon:
        ReceiptText,
    },

    {
      label:
        "Promedio diario",

      value:
        formatCurrency(
          averageDailyRevenue,
        ),

      description:
        `Promedio en ${periodDays} días`,

      change:
        dailyChange,

      icon:
        Activity,
    },
  ];


  function exportRows():
    ExportRow[] {
    return dailySales.map(
      (item) => {
        const revenue =
          numberValue(
            item.revenue,
          );

        const count =
          numberValue(
            item.sales_count,
          );

        return {
          Fecha:
            formatDate(
              item.date,
            ),

          Ventas:
            count,

          Ingresos:
            revenue,

          "Ticket diario":
            count > 0
              ? revenue
                / count
              : 0,
        };
      },
    );
  }


  function exportFilename() {
    return `analisis-${exportDateStamp()}`;
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
        "Análisis",
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
        "Análisis - SalesIA Enterprise",
        "Resumen del rendimiento comercial.",
      );
    } catch (
      currentError
    ) {
      setExportError(
        currentError
          instanceof Error
          ? currentError.message
          : "No se pudo compartir el análisis.",
      );
    }
  }


  return (
    <section
      ref={exportRef}
      className="analysis-page"
    >
      <header className="analysis-header">
        <div>
          <div className="analysis-eyebrow">
            <BarChart3
              size={15}
            />

            Inteligencia comercial
          </div>

          <h1>
            Análisis
          </h1>

          <p>
            Entiende rápidamente cómo está funcionando el negocio y qué cambió frente al periodo anterior.
          </p>
        </div>

        <div
          className="analysis-header-actions"
          data-export-hide="true"
        >
          <ExportActions
            disabled={
              loading
              || !dashboard
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
            className="analysis-refresh"
            disabled={
              loading
            }
            onClick={() =>
              void loadAnalytics()
            }
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? "analysis-spin"
                  : ""
              }
            />

            {loading
              ? "Actualizando..."
              : "Actualizar"}
          </button>
        </div>
      </header>


      <section
        className="analysis-filters"
        data-export-hide="true"
      >
        <label>
          <span>
            Periodo
          </span>

          <select
            value={
              periodOption
            }
            onChange={(
              event,
            ) =>
              changePeriod(
                event.target.value,
              )
            }
          >
            <option value="7">
              Últimos 7 días
            </option>

            <option value="30">
              Últimos 30 días
            </option>

            <option value="90">
              Últimos 90 días
            </option>

            <option value="custom">
              Personalizado
            </option>
          </select>
        </label>

        <label>
          <span>
            Desde
          </span>

          <input
            type="date"
            value={
              startDate
            }
            onChange={(
              event,
            ) => {
              setStartDate(
                event.target.value,
              );

              setPeriodOption(
                "custom",
              );
            }}
          />
        </label>

        <label>
          <span>
            Hasta
          </span>

          <input
            type="date"
            value={
              endDate
            }
            onChange={(
              event,
            ) => {
              setEndDate(
                event.target.value,
              );

              setPeriodOption(
                "custom",
              );
            }}
          />
        </label>

        <div className="analysis-comparison">
          <span>
            Comparación
          </span>

          <strong>
            Periodo anterior
          </strong>
        </div>

        <button
          type="button"
          className="analysis-apply"
          disabled={
            loading
          }
          onClick={() =>
            void loadAnalytics()
          }
        >
          <CalendarRange
            size={16}
          />

          Aplicar
        </button>
      </section>


      {error && (
        <div className="analysis-error">
          {error}
        </div>
      )}

      {exportError && (
        <div className="analysis-error">
          {exportError}
        </div>
      )}


      {loading &&
        !dashboard ? (
        <div className="analysis-loading">
          <RefreshCw
            size={24}
            className="analysis-spin"
          />

          <div>
            <strong>
              Preparando análisis
            </strong>

            <span>
              Procesando la información comercial...
            </span>
          </div>
        </div>
      ) : dashboard ? (
        <>
          <section className="analysis-kpis">
            {kpis.map(
              (kpi) => {
                const Icon =
                  kpi.icon;

                return (
                  <article
                    key={
                      kpi.label
                    }
                    className="analysis-kpi"
                  >
                    <div className="analysis-kpi-top">
                      <span className="analysis-kpi-icon">
                        <Icon
                          size={18}
                        />
                      </span>

                      <div
                        className={`analysis-change ${kpi.change.direction}`}
                      >
                        {kpi.change.direction ===
                        "positive" ? (
                          <ArrowUpRight
                            size={14}
                          />
                        ) : kpi.change.direction ===
                          "negative" ? (
                          <ArrowDownRight
                            size={14}
                          />
                        ) : null}

                        <span>
                          {
                            kpi.change.label
                          }
                        </span>
                      </div>
                    </div>

                    <span className="analysis-kpi-label">
                      {
                        kpi.label
                      }
                    </span>

                    <strong>
                      {
                        kpi.value
                      }
                    </strong>

                    <small>
                      {
                        kpi.description
                      }
                    </small>
                  </article>
                );
              },
            )}
          </section>


          <section className="analysis-summary">
            <div className="analysis-summary-icon">
              <Sparkles
                size={21}
              />
            </div>

            <div className="analysis-summary-content">
              <span>
                RESUMEN DEL PERIODO
              </span>

              <h2>
                {summaryTitle}
              </h2>

              <p>
                {summaryText}
                {" "}

                {bestDay
                  ? `El mejor día fue ${formatDate(
                      bestDay.date,
                    )}, con ${formatCurrency(
                      bestDay.revenue,
                    )}.`
                  : "No hubo ventas completadas en el periodo."}
              </p>
            </div>

            <div className="analysis-summary-status">
              <span>
                Actividad
              </span>

              <strong>
                {activeDays}
                {" de "}
                {periodDays}
                {" días"}
              </strong>

              <small>
                {formatNumber(
                  activityRate,
                  1,
                )}
                % del periodo
              </small>
            </div>
          </section>


          <section className="analysis-main-grid">
            <article className="analysis-panel analysis-chart-panel">
              <header className="analysis-panel-header">
                <div>
                  <span>
                    EVOLUCIÓN
                  </span>

                  <h2>
                    Rendimiento comercial
                  </h2>

                  <p>
                    Consulta la evolución diaria sin mezclar demasiadas métricas.
                  </p>
                </div>

                <div className="analysis-chart-switch">
                  <button
                    type="button"
                    className={
                      chartMetric ===
                      "revenue"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setChartMetric(
                        "revenue",
                      )
                    }
                  >
                    Ingresos
                  </button>

                  <button
                    type="button"
                    className={
                      chartMetric ===
                      "sales"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setChartMetric(
                        "sales",
                      )
                    }
                  >
                    N.º ventas
                  </button>
                </div>
              </header>

              <div className="analysis-chart">
                {chartData.length >
                0 ? (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <AreaChart
                      data={
                        chartData
                      }
                      margin={{
                        top: 12,
                        right: 14,
                        bottom: 0,
                        left: 0,
                      }}
                    >
                      <defs>
                        <linearGradient
                          id="analysisArea"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#0891b2"
                            stopOpacity={
                              0.25
                            }
                          />

                          <stop
                            offset="100%"
                            stopColor="#0891b2"
                            stopOpacity={
                              0.02
                            }
                          />
                        </linearGradient>
                      </defs>

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
                        tick={{
                          fill:
                            "#64748b",
                          fontSize:
                            11,
                        }}
                      />

                      <YAxis
                        axisLine={
                          false
                        }
                        tickLine={
                          false
                        }
                        width={72}
                        allowDecimals={
                          chartMetric ===
                          "revenue"
                        }
                        tick={{
                          fill:
                            "#64748b",
                          fontSize:
                            10,
                        }}
                        tickFormatter={(
                          value,
                        ) =>
                          chartMetric ===
                          "revenue"
                            ? `S/ ${formatNumber(
                                value,
                                0,
                              )}`
                            : formatNumber(
                                value,
                                0,
                              )
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
                        ) => [
                          chartMetric ===
                          "revenue"
                            ? formatCurrency(
                                value,
                              )
                            : formatNumber(
                                value,
                                0,
                              ),

                          chartMetric ===
                          "revenue"
                            ? "Ingresos"
                            : "Ventas",
                        ]}
                      />

                      <Area
                        type="monotone"
                        dataKey={
                          chartMetric
                        }
                        stroke="#0891b2"
                        strokeWidth={2.5}
                        fill="url(#analysisArea)"
                        activeDot={{
                          r: 5,
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="analysis-empty">
                    No hay ventas completadas en este periodo.
                  </div>
                )}
              </div>
            </article>


            <aside className="analysis-panel analysis-reading">
              <header className="analysis-panel-header">
                <div>
                  <span>
                    LECTURA RÁPIDA
                  </span>

                  <h2>
                    Qué debes saber
                  </h2>
                </div>

                <Activity
                  size={19}
                />
              </header>

              <div className="analysis-reading-list">
                <div>
                  <span>
                    Mejor día
                  </span>

                  <strong>
                    {bestDay
                      ? formatDate(
                          bestDay.date,
                        )
                      : "Sin datos"}
                  </strong>

                  <small>
                    {bestDay
                      ? formatCurrency(
                          bestDay.revenue,
                        )
                      : "—"}
                  </small>
                </div>

                <div>
                  <span>
                    Días con ventas
                  </span>

                  <strong>
                    {activeDays}
                    {" / "}
                    {periodDays}
                  </strong>

                  <small>
                    {formatNumber(
                      activityRate,
                      1,
                    )}
                    % del periodo
                  </small>
                </div>

                <div>
                  <span>
                    Concentración
                  </span>

                  <strong>
                    {concentration}
                  </strong>

                  <small>
                    El mejor día representa{" "}
                    {formatNumber(
                      bestDayShare,
                      1,
                    )}
                    % de los ingresos
                  </small>
                </div>

                <div>
                  <span>
                    Ticket promedio
                  </span>

                  <strong>
                    {formatCurrency(
                      averageTicket,
                    )}
                  </strong>

                  <small>
                    Por cada venta completada
                  </small>
                </div>
              </div>
            </aside>
          </section>


          <section className="analysis-panel analysis-ranking">
            <header className="analysis-panel-header">
              <div>
                <span>
                  RANKING
                </span>

                <h2>
                  Días con mayores ingresos
                </h2>

                <p>
                  Identifica rápidamente cuándo se concentraron las ventas.
                </p>
              </div>

              <Trophy
                size={19}
              />
            </header>

            {topDays.length ===
            0 ? (
              <div className="analysis-empty small">
                No hay información disponible.
              </div>
            ) : (
              <div className="analysis-ranking-list">
                {topDays.map(
                  (
                    item,
                    index,
                  ) => {
                    const revenue =
                      numberValue(
                        item.revenue,
                      );

                    const width =
                      bestDayRevenue >
                      0
                        ? (
                            revenue
                            /
                            bestDayRevenue
                          )
                          * 100
                        : 0;

                    return (
                      <div
                        className="analysis-ranking-row"
                        key={
                          item.date
                        }
                      >
                        <span className="analysis-ranking-position">
                          {index + 1}
                        </span>

                        <div className="analysis-ranking-data">
                          <div>
                            <strong>
                              {formatDate(
                                item.date,
                              )}
                            </strong>

                            <span>
                              {
                                item.sales_count
                              }{" "}
                              venta
                              {item.sales_count ===
                              1
                                ? ""
                                : "s"}
                            </span>
                          </div>

                          <div className="analysis-ranking-amount">
                            {formatCurrency(
                              revenue,
                            )}
                          </div>

                          <div className="analysis-ranking-track">
                            <div
                              style={{
                                width:
                                  `${width}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </section>


          <details className="analysis-advanced">
            <summary>
              <span>
                <Sigma
                  size={18}
                />

                Estadística avanzada y detalle diario
              </span>

              <small>
                Ver media, mediana y desglose del periodo
              </small>
            </summary>

            <div className="analysis-advanced-content">
              <div className="analysis-stat-grid">
                <article>
                  <span>
                    Observaciones
                  </span>

                  <strong>
                    {
                      salesAnalysis
                        ?.count
                      ?? 0
                    }
                  </strong>

                  <small>
                    Ventas analizadas
                  </small>
                </article>

                <article>
                  <span>
                    Media
                  </span>

                  <strong>
                    {formatCurrency(
                      salesAnalysis
                        ?.mean
                      ?? averageTicket,
                    )}
                  </strong>

                  <small>
                    Promedio estadístico
                  </small>
                </article>

                <article>
                  <span>
                    Mediana
                  </span>

                  <strong>
                    {formatCurrency(
                      salesAnalysis
                        ?.median
                      ?? medianTicket,
                    )}
                  </strong>

                  <small>
                    Valor central
                  </small>
                </article>

                <article>
                  <span>
                    Diferencia
                  </span>

                  <strong>
                    {formatCurrency(
                      salesAnalysis
                        ?.difference
                      ?? Math.abs(
                        averageTicket
                        - medianTicket,
                      ),
                    )}
                  </strong>

                  <small>
                    Media vs. mediana
                  </small>
                </article>
              </div>

              {salesAnalysis
                ?.interpretation && (
                <div className="analysis-interpretation">
                  <strong>
                    Interpretación
                  </strong>

                  <p>
                    {
                      salesAnalysis
                        .interpretation
                    }
                  </p>
                </div>
              )}

              <div className="analysis-table-wrap">
                <table className="analysis-table">
                  <thead>
                    <tr>
                      <th>
                        Fecha
                      </th>

                      <th>
                        Ventas
                      </th>

                      <th>
                        Ingresos
                      </th>

                      <th>
                        Ticket diario
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {dailySales.map(
                      (item) => {
                        const revenue =
                          numberValue(
                            item.revenue,
                          );

                        const count =
                          numberValue(
                            item.sales_count,
                          );

                        return (
                          <tr
                            key={
                              item.date
                            }
                          >
                            <td>
                              {formatDate(
                                item.date,
                              )}
                            </td>

                            <td>
                              {formatNumber(
                                count,
                                0,
                              )}
                            </td>

                            <td>
                              {formatCurrency(
                                revenue,
                              )}
                            </td>

                            <td>
                              {formatCurrency(
                                count > 0
                                  ? revenue
                                    / count
                                  : 0,
                              )}
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </details>
        </>
      ) : null}
    </section>
  );
}
