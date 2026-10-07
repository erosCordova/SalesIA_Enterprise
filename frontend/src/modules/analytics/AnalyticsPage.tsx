import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Activity,
  ArrowUpRight,
  Banknote,
  BarChart3,
  CalendarRange,
  RefreshCw,
  ReceiptText,
  ShoppingBag,
  Sigma,
  TrendingUp,
  Trophy,
} from "lucide-react";

import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
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


function dateOffset(
  offset: number,
) {
  const date =
    new Date();

  date.setDate(
    date.getDate() + offset,
  );

  return date.toLocaleDateString(
    "en-CA",
  );
}


function numberValue(
  value: unknown,
) {
  const parsed =
    Number(value);

  return Number.isFinite(parsed)
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
  maximumFractionDigits = 2,
) {
  return new Intl.NumberFormat(
    "es-PE",
    {
      maximumFractionDigits,
    },
  ).format(
    numberValue(value),
  );
}


function formatCompactCurrency(
  value: unknown,
) {
  const amount =
    numberValue(value);

  if (
    Math.abs(amount) >=
    1_000_000
  ) {
    return `S/ ${(amount / 1_000_000).toFixed(1)}M`;
  }

  if (
    Math.abs(amount) >=
    1_000
  ) {
    return `S/ ${(amount / 1_000).toFixed(1)}k`;
  }

  return `S/ ${Math.round(amount)}`;
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
  ).format(date);
}


function formatChartDate(
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
      month: "2-digit",
    },
  ).format(date);
}


export default function AnalyticsPage() {
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
    startDate,
    setStartDate,
  ] =
    useState(
      dateOffset(-29),
    );

  const [
    endDate,
    setEndDate,
  ] =
    useState(
      dateOffset(0),
    );

  const [
    dashboard,
    setDashboard,
  ] =
    useState<
      AnalyticsDashboardResponse | null
    >(null);

  const [
    salesAnalysis,
    setSalesAnalysis,
  ] =
    useState<
      SalesStatisticsResponse | null
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


  async function loadAnalytics(
    rangeStart = startDate,
    rangeEnd = endDate,
  ) {
    setError("");

    if (
      rangeStart
      && rangeEnd
      && rangeStart > rangeEnd
    ) {
      setError(
        "La fecha inicial no puede ser posterior a la fecha final.",
      );

      return;
    }

    setLoading(true);

    try {
      const [
        dashboardResponse,
        analysisResponse,
      ] =
        await Promise.all([
          getAnalyticsDashboard(
            rangeStart || undefined,
            rangeEnd || undefined,
          ),

          analyzeSalesStatistics(
            rangeStart || undefined,
            rangeEnd || undefined,
          ),
        ]);

      setDashboard(
        dashboardResponse,
      );

      setSalesAnalysis(
        analysisResponse,
      );
    } catch (
      requestError
    ) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo cargar la información analítica.",
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(
    () => {
      void loadAnalytics(
        dateOffset(-29),
        dateOffset(0),
      );
    },
    [],
  );


  function structuredExportRows(): ExportRow[] {
    const rows: ExportRow[] = [];


    rows.push(
      {
        Sección:
          "Resumen",
        Fecha:
          "",
        Indicador:
          "Ingresos totales",
        Valor:
          totalRevenue,
        Ventas:
          "",
        Ingresos:
          "",
        Detalle:
          `Período ${startDate} al ${endDate}`,
      },
      {
        Sección:
          "Resumen",
        Fecha:
          "",
        Indicador:
          "Ventas completadas",
        Valor:
          totalSales,
        Ventas:
          "",
        Ingresos:
          "",
        Detalle:
          `Período ${startDate} al ${endDate}`,
      },
      {
        Sección:
          "Resumen",
        Fecha:
          "",
        Indicador:
          "Ticket promedio",
        Valor:
          averageTicket,
        Ventas:
          "",
        Ingresos:
          "",
        Detalle:
          "",
      },
      {
        Sección:
          "Resumen",
        Fecha:
          "",
        Indicador:
          "Ticket mediano",
        Valor:
          medianTicket,
        Ventas:
          "",
        Ingresos:
          "",
        Detalle:
          "",
      },
      {
        Sección:
          "Resumen",
        Fecha:
          "",
        Indicador:
          "Promedio diario de ingresos",
        Valor:
          averageDailyRevenue,
        Ventas:
          "",
        Ingresos:
          "",
        Detalle:
          "",
      },
      {
        Sección:
          "Resumen",
        Fecha:
          "",
        Indicador:
          "Promedio diario de ventas",
        Valor:
          averageDailySales,
        Ventas:
          "",
        Ingresos:
          "",
        Detalle:
          "",
      },
      {
        Sección:
          "Estadística",
        Fecha:
          "",
        Indicador:
          "Diferencia media-mediana",
        Valor:
          ticketDifference,
        Ventas:
          "",
        Ingresos:
          "",
        Detalle:
          salesAnalysis?.interpretation
          ?? "",
      },
    );


    dailySales.forEach(
      (item) => {
        const revenue =
          numberValue(
            item.revenue,
          );


        const dailyTicket =
          item.sales_count > 0
            ? revenue /
              item.sales_count
            : 0;


        rows.push({
          Sección:
            "Rendimiento diario",

          Fecha:
            item.date,

          Indicador:
            "Actividad diaria",

          Valor:
            dailyTicket,

          Ventas:
            item.sales_count,

          Ingresos:
            revenue,

          Detalle:
            "Valor = ticket diario",
        });
      },
    );


    return rows;
  }


  function exportFilename() {
    return `analytics-${startDate}-${endDate}-${exportDateStamp()}`;
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
        structuredExportRows(),
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
        "Analytics",
        structuredExportRows(),
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
        "Analytics - SalesIA Enterprise",
        `Análisis comercial del ${startDate} al ${endDate}.`,
      );
    } catch (
      currentError
    ) {
      setExportError(
        currentError instanceof Error
          ? currentError.message
          : "No se pudo compartir el análisis.",
      );
    }
  }


  function applyPreset(
    days: number,
  ) {
    const from =
      dateOffset(
        -(days - 1),
      );

    const to =
      dateOffset(0);

    setStartDate(from);
    setEndDate(to);

    void loadAnalytics(
      from,
      to,
    );
  }


  function presetActive(
    days: number,
  ) {
    return (
      startDate ===
        dateOffset(
          -(days - 1),
        )
      &&
      endDate ===
        dateOffset(0)
    );
  }


  const dailySales =
    dashboard?.daily_sales
    ?? [];


  const totalSales =
    numberValue(
      dashboard
        ?.summary
        .total_sales,
    );


  const totalRevenue =
    numberValue(
      dashboard
        ?.summary
        .total_revenue,
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


  const activeDays =
    dailySales.length;


  const averageDailyRevenue =
    activeDays > 0
      ? totalRevenue /
        activeDays
      : 0;


  const averageDailySales =
    activeDays > 0
      ? totalSales /
        activeDays
      : 0;


  const chartData =
    useMemo(
      () =>
        dailySales.map(
          (item) => ({
            date:
              item.date,

            day:
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
              first,
              second,
            ) =>
              numberValue(
                second.revenue,
              )
              -
              numberValue(
                first.revenue,
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


  const maxDailyRevenue =
    bestDay
      ? numberValue(
          bestDay.revenue,
        )
      : 0;


  const ticketDifference =
    salesAnalysis
      ? numberValue(
          salesAnalysis.difference,
        )
      : Math.abs(
          averageTicket
          -
          medianTicket,
        );


  return (
    <section
      ref={exportRef}
      className="analytics-bi-page"
    >
      <header className="analytics-bi-header">
        <div>
          <div className="analytics-bi-eyebrow">
            <BarChart3
              size={14}
            />

            Inteligencia comercial
          </div>

          <h1>
            Analytics
          </h1>

          <p>
            Rendimiento de ventas,
            comportamiento diario y
            lectura estadística del negocio.
          </p>
        </div>


        <div className="analytics-bi-header-actions">
          <div className="analytics-period-chip">
            <CalendarRange
              size={15}
            />

            <span>
              {formatDate(
                startDate,
              )}
              {" — "}
              {formatDate(
                endDate,
              )}
            </span>
          </div>

          <ExportActions
            disabled={
              loading
              || !dashboard
            }
            onPdf={handlePdf}
            onCsv={handleCsv}
            onExcel={handleExcel}
            onShare={handleShare}
          />


          <button
            type="button"
            className="analytics-bi-refresh"
            data-export-hide="true"
            disabled={loading}
            onClick={() =>
              void loadAnalytics()
            }
          >
            <RefreshCw
              size={15}
              className={
                loading
                  ? "analytics-bi-spin"
                  : ""
              }
            />

            {loading
              ? "Actualizando"
              : "Actualizar"}
          </button>
        </div>
      </header>


      <section
        className="analytics-bi-filterbar"
        data-export-hide="true"
      >
        <div className="analytics-presets">
          <span>
            Periodo
          </span>

          {[7, 30, 90].map(
            (days) => (
              <button
                key={days}
                type="button"
                className={
                  presetActive(
                    days,
                  )
                    ? "active"
                    : ""
                }
                onClick={() =>
                  applyPreset(
                    days,
                  )
                }
              >
                {days} días
              </button>
            ),
          )}
        </div>


        <div className="analytics-custom-range">
          <label>
            <span>
              Desde
            </span>

            <input
              type="date"
              value={startDate}
              onChange={(
                event,
              ) =>
                setStartDate(
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            <span>
              Hasta
            </span>

            <input
              type="date"
              value={endDate}
              onChange={(
                event,
              ) =>
                setEndDate(
                  event.target.value,
                )
              }
            />
          </label>

          <button
            type="button"
            className="analytics-bi-apply"
            disabled={loading}
            onClick={() =>
              void loadAnalytics()
            }
          >
            <TrendingUp
              size={15}
            />

            Aplicar
          </button>
        </div>
      </section>


      {exportError && (
        <div
          className="analytics-bi-error"
          data-export-hide="true"
        >
          {exportError}
        </div>
      )}


      {error && (
        <div className="analytics-bi-error">
          {error}
        </div>
      )}


      {dashboard ? (
        <>
          <section className="analytics-overview-card">
            <div className="analytics-overview-main">
              <span className="analytics-overview-label">
                INGRESOS DEL PERIODO
              </span>

              <strong>
                {formatCurrency(
                  totalRevenue,
                )}
              </strong>

              <p>
                Total generado por ventas
                completadas dentro del rango
                seleccionado.
              </p>
            </div>


            <div className="analytics-overview-divider" />


            <div className="analytics-overview-item">
              <span>
                Ventas
              </span>

              <strong>
                {formatNumber(
                  totalSales,
                  0,
                )}
              </strong>

              <small>
                operaciones
              </small>
            </div>


            <div className="analytics-overview-item">
              <span>
                Días con actividad
              </span>

              <strong>
                {activeDays}
              </strong>

              <small>
                registrados
              </small>
            </div>


            <div className="analytics-overview-item">
              <span>
                Promedio diario
              </span>

              <strong>
                {formatCurrency(
                  averageDailyRevenue,
                )}
              </strong>

              <small>
                ingresos / día
              </small>
            </div>
          </section>


          <section className="analytics-bi-kpis">
            <article>
              <div className="analytics-kpi-top">
                <span className="analytics-kpi-icon cyan">
                  <ShoppingBag
                    size={17}
                  />
                </span>

                <ArrowUpRight
                  size={15}
                />
              </div>

              <span className="analytics-kpi-label">
                Ventas completadas
              </span>

              <strong>
                {formatNumber(
                  totalSales,
                  0,
                )}
              </strong>

              <small>
                Total del periodo
              </small>
            </article>


            <article>
              <div className="analytics-kpi-top">
                <span className="analytics-kpi-icon blue">
                  <ReceiptText
                    size={17}
                  />
                </span>

                <Activity
                  size={15}
                />
              </div>

              <span className="analytics-kpi-label">
                Ticket promedio
              </span>

              <strong>
                {formatCurrency(
                  averageTicket,
                )}
              </strong>

              <small>
                Media por venta
              </small>
            </article>


            <article>
              <div className="analytics-kpi-top">
                <span className="analytics-kpi-icon violet">
                  <Sigma
                    size={17}
                  />
                </span>

                <Activity
                  size={15}
                />
              </div>

              <span className="analytics-kpi-label">
                Ticket mediano
              </span>

              <strong>
                {formatCurrency(
                  medianTicket,
                )}
              </strong>

              <small>
                Punto central
              </small>
            </article>


            <article>
              <div className="analytics-kpi-top">
                <span className="analytics-kpi-icon green">
                  <Banknote
                    size={17}
                  />
                </span>

                <TrendingUp
                  size={15}
                />
              </div>

              <span className="analytics-kpi-label">
                Ventas por día
              </span>

              <strong>
                {formatNumber(
                  averageDailySales,
                  1,
                )}
              </strong>

              <small>
                Promedio diario
              </small>
            </article>
          </section>


          <section className="analytics-bi-primary-grid">
            <article className="analytics-bi-panel analytics-performance-panel">
              <header className="analytics-bi-panel-header">
                <div>
                  <span>
                    RENDIMIENTO COMERCIAL
                  </span>

                  <h2>
                    Evolución de ingresos
                  </h2>

                  <p>
                    Ingresos y volumen de
                    operaciones por día.
                  </p>
                </div>

                <div className="analytics-chart-legend">
                  <span>
                    <i className="revenue" />
                    Ingresos
                  </span>

                  <span>
                    <i className="sales" />
                    Ventas
                  </span>
                </div>
              </header>


              <div className="analytics-bi-main-chart">
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
                        right: 6,
                        bottom: 0,
                        left: 0,
                      }}
                    >
                      <defs>
                        <linearGradient
                          id="analyticsMainGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#0EA5B7"
                            stopOpacity={
                              0.32
                            }
                          />

                          <stop
                            offset="100%"
                            stopColor="#0EA5B7"
                            stopOpacity={
                              0.015
                            }
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        vertical={
                          false
                        }
                        stroke="#E8EEF2"
                        strokeDasharray="4 4"
                      />

                      <XAxis
                        dataKey="day"
                        axisLine={
                          false
                        }
                        tickLine={
                          false
                        }
                        tick={{
                          fill:
                            "#64748B",
                          fontSize:
                            10,
                        }}
                      />

                      <YAxis
                        yAxisId="revenue"
                        axisLine={
                          false
                        }
                        tickLine={
                          false
                        }
                        width={72}
                        tick={{
                          fill:
                            "#64748B",
                          fontSize:
                            10,
                        }}
                        tickFormatter={
                          formatCompactCurrency
                        }
                      />

                      <YAxis
                        yAxisId="sales"
                        orientation="right"
                        axisLine={
                          false
                        }
                        tickLine={
                          false
                        }
                        width={32}
                        tick={{
                          fill:
                            "#94A3B8",
                          fontSize:
                            9,
                        }}
                      />

                      <Tooltip
                        contentStyle={{
                          border:
                            "1px solid #DCE6EB",
                          borderRadius:
                            11,
                          boxShadow:
                            "0 10px 30px rgba(15,23,42,.10)",
                          fontSize:
                            10,
                        }}
                        formatter={(
                          value,
                          name,
                        ) =>
                          name ===
                          "Ingresos"
                            ? [
                                formatCurrency(
                                  value,
                                ),
                                "Ingresos",
                              ]
                            : [
                                formatNumber(
                                  value,
                                  0,
                                ),
                                "Ventas",
                              ]
                        }
                      />

                      <Area
                        yAxisId="revenue"
                        type="monotone"
                        dataKey="revenue"
                        name="Ingresos"
                        stroke="#0EA5B7"
                        strokeWidth={
                          2.5
                        }
                        fill="url(#analyticsMainGradient)"
                      />

                      <Line
                        yAxisId="sales"
                        type="monotone"
                        dataKey="sales"
                        name="Ventas"
                        stroke="#2563EB"
                        strokeWidth={
                          2
                        }
                        dot={{
                          r: 2.5,
                          fill:
                            "#2563EB",
                        }}
                        activeDot={{
                          r: 4,
                        }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="analytics-bi-empty-chart">
                    <BarChart3
                      size={25}
                    />

                    <span>
                      No hay actividad en
                      el periodo seleccionado.
                    </span>
                  </div>
                )}
              </div>
            </article>


            <aside className="analytics-pulse-panel">
              <div className="analytics-pulse-heading">
                <div>
                  <span>
                    PULSO COMERCIAL
                  </span>

                  <h2>
                    Lectura del periodo
                  </h2>
                </div>

                <Activity
                  size={19}
                />
              </div>


              <div className="analytics-pulse-list">
                <div>
                  <span className="analytics-pulse-icon trophy">
                    <Trophy
                      size={16}
                    />
                  </span>

                  <div>
                    <small>
                      Mejor día
                    </small>

                    <strong>
                      {bestDay
                        ? formatDate(
                            bestDay.date,
                          )
                        : "Sin datos"}
                    </strong>

                    <span>
                      {bestDay
                        ? formatCurrency(
                            bestDay.revenue,
                          )
                        : "—"}
                    </span>
                  </div>
                </div>


                <div>
                  <span className="analytics-pulse-icon">
                    <Banknote
                      size={16}
                    />
                  </span>

                  <div>
                    <small>
                      Ingreso diario medio
                    </small>

                    <strong>
                      {formatCurrency(
                        averageDailyRevenue,
                      )}
                    </strong>

                    <span>
                      {activeDays} días
                      con actividad
                    </span>
                  </div>
                </div>


                <div>
                  <span className="analytics-pulse-icon blue">
                    <Sigma
                      size={16}
                    />
                  </span>

                  <div>
                    <small>
                      Diferencia media-mediana
                    </small>

                    <strong>
                      {formatCurrency(
                        ticketDifference,
                      )}
                    </strong>

                    <span>
                      dispersión del ticket
                    </span>
                  </div>
                </div>
              </div>


              {salesAnalysis && (
                <div className="analytics-pulse-insight">
                  <span>
                    INTERPRETACIÓN
                  </span>

                  <p>
                    {
                      salesAnalysis
                        .interpretation
                    }
                  </p>
                </div>
              )}
            </aside>
          </section>


          <section className="analytics-bi-secondary-grid">
            <article className="analytics-bi-panel">
              <header className="analytics-bi-panel-header compact">
                <div>
                  <span>
                    VOLUMEN
                  </span>

                  <h2>
                    Operaciones por día
                  </h2>
                </div>

                <ShoppingBag
                  size={18}
                />
              </header>


              <div className="analytics-volume-chart">
                {chartData.length >
                0 ? (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={
                        chartData
                      }
                      margin={{
                        top: 8,
                        right: 5,
                        bottom: 0,
                        left: -20,
                      }}
                    >
                      <CartesianGrid
                        vertical={
                          false
                        }
                        stroke="#EEF2F5"
                      />

                      <XAxis
                        dataKey="day"
                        axisLine={
                          false
                        }
                        tickLine={
                          false
                        }
                        tick={{
                          fill:
                            "#64748B",
                          fontSize:
                            9,
                        }}
                      />

                      <YAxis
                        axisLine={
                          false
                        }
                        tickLine={
                          false
                        }
                        allowDecimals={
                          false
                        }
                        tick={{
                          fill:
                            "#94A3B8",
                          fontSize:
                            9,
                        }}
                      />

                      <Tooltip
                        contentStyle={{
                          border:
                            "1px solid #DCE6EB",
                          borderRadius:
                            10,
                          fontSize:
                            10,
                        }}
                        formatter={(
                          value,
                        ) => [
                          formatNumber(
                            value,
                            0,
                          ),
                          "Ventas",
                        ]}
                      />

                      <Bar
                        dataKey="sales"
                        name="Ventas"
                        fill="#22B8CC"
                        radius={[
                          5,
                          5,
                          0,
                          0,
                        ]}
                        maxBarSize={
                          30
                        }
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="analytics-bi-empty-chart">
                    Sin datos
                  </div>
                )}
              </div>
            </article>


            <article className="analytics-ranking-panel">
              <header className="analytics-bi-panel-header compact">
                <div>
                  <span>
                    RANKING
                  </span>

                  <h2>
                    Días con mayor ingreso
                  </h2>
                </div>

                <Trophy
                  size={18}
                />
              </header>


              <div className="analytics-ranking-list">
                {topDays.length ===
                0 ? (
                  <div className="analytics-ranking-empty">
                    Sin información disponible.
                  </div>
                ) : (
                  topDays.map(
                    (
                      item,
                      index,
                    ) => {
                      const revenue =
                        numberValue(
                          item.revenue,
                        );

                      const width =
                        maxDailyRevenue >
                        0
                          ? (
                              revenue
                              /
                              maxDailyRevenue
                            ) * 100
                          : 0;

                      return (
                        <div
                          className="analytics-ranking-row"
                          key={
                            item.date
                          }
                        >
                          <span className="analytics-ranking-position">
                            {index + 1}
                          </span>

                          <div className="analytics-ranking-content">
                            <div className="analytics-ranking-top">
                              <span>
                                {formatDate(
                                  item.date,
                                )}
                              </span>

                              <strong>
                                {formatCurrency(
                                  revenue,
                                )}
                              </strong>
                            </div>

                            <div className="analytics-ranking-track">
                              <div
                                style={{
                                  width:
                                    `${width}%`,
                                }}
                              />
                            </div>

                            <small>
                              {
                                item.sales_count
                              }{" "}
                              venta
                              {item.sales_count ===
                              1
                                ? ""
                                : "s"}
                            </small>
                          </div>
                        </div>
                      );
                    },
                  )
                )}
              </div>
            </article>
          </section>


          <section className="analytics-bi-panel analytics-statistics-strip">
            <header className="analytics-bi-panel-header compact">
              <div>
                <span>
                  ESTADÍSTICA COMERCIAL
                </span>

                <h2>
                  Distribución de los tickets
                </h2>
              </div>

              <Sigma
                size={18}
              />
            </header>


            <div className="analytics-statistics-values">
              <div>
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
              </div>

              <div>
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
              </div>

              <div>
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
              </div>

              <div>
                <span>
                  Diferencia
                </span>

                <strong>
                  {formatCurrency(
                    ticketDifference,
                  )}
                </strong>
              </div>
            </div>
          </section>


          <section className="analytics-bi-panel analytics-detail-panel">
            <header className="analytics-bi-panel-header">
              <div>
                <span>
                  DETALLE OPERATIVO
                </span>

                <h2>
                  Rendimiento diario
                </h2>

                <p>
                  Desglose de ventas e
                  ingresos del periodo.
                </p>
              </div>

              <div className="analytics-record-count">
                {dailySales.length}
                {" "}
                registro
                {dailySales.length ===
                1
                  ? ""
                  : "s"}
              </div>
            </header>


            {dailySales.length ===
            0 ? (
              <div className="analytics-bi-table-empty">
                No hay ventas completadas
                en este periodo.
              </div>
            ) : (
              <div className="analytics-bi-table-wrapper">
                <table className="analytics-bi-table">
                  <thead>
                    <tr>
                      <th>
                        Fecha
                      </th>

                      <th>
                        Operaciones
                      </th>

                      <th>
                        Ingresos
                      </th>

                      <th>
                        Ticket diario
                      </th>

                      <th>
                        Participación en ingresos
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {dailySales.map(
                      (
                        item,
                      ) => {
                        const revenue =
                          numberValue(
                            item.revenue,
                          );

                        const share =
                          totalRevenue >
                          0
                            ? (
                                revenue
                                /
                                totalRevenue
                              ) * 100
                            : 0;

                        const dailyTicket =
                          item.sales_count >
                          0
                            ? revenue
                              /
                              item.sales_count
                            : 0;

                        return (
                          <tr
                            key={
                              item.date
                            }
                          >
                            <td>
                              <strong>
                                {formatDate(
                                  item.date,
                                )}
                              </strong>
                            </td>

                            <td>
                              {
                                item.sales_count
                              }
                            </td>

                            <td>
                              <strong className="analytics-bi-revenue">
                                {formatCurrency(
                                  revenue,
                                )}
                              </strong>
                            </td>

                            <td>
                              {formatCurrency(
                                dailyTicket,
                              )}
                            </td>

                            <td>
                              <div className="analytics-share-cell">
                                <div className="analytics-share-track">
                                  <div
                                    style={{
                                      width:
                                        `${Math.min(
                                          100,
                                          share,
                                        )}%`,
                                    }}
                                  />
                                </div>

                                <span>
                                  {formatNumber(
                                    share,
                                    1,
                                  )}
                                  %
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : loading ? (
        <section className="analytics-bi-loading">
          <RefreshCw
            size={22}
            className="analytics-bi-spin"
          />

          <div>
            <strong>
              Preparando Analytics
            </strong>

            <span>
              Procesando información
              comercial...
            </span>
          </div>
        </section>
      ) : null}
    </section>
  );
}
