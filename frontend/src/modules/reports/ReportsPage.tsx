import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Banknote,
  CalendarRange,
  ExternalLink,
  FileText,
  RefreshCw,
  Search,
  ShoppingCart,
  Trophy,
} from "lucide-react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import ExportActions from "../../components/ui/ExportActions";

import {
  useApiResource,
} from "../../hooks/useApiResource";

import {
  getAnalyticsDashboard,
} from "../../services/analytics.service";

import {
  getReports,
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
  AnalyticsDashboardResponse,
} from "../../types/analytics";

import type {
  ReportItem,
} from "../../types/reporting";

import "./reports-commercial.css";


function dateOffset(
  days: number,
) {
  const date =
    new Date();

  date.setDate(
    date.getDate() + days,
  );

  return date
    .toISOString()
    .slice(0, 10);
}


function numberValue(
  value:
    | number
    | string
    | null
    | undefined,
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
  value: number,
) {
  return new Intl.NumberFormat(
    "es-PE",
    {
      style: "currency",
      currency: "PEN",
      maximumFractionDigits: 2,
    },
  ).format(value);
}


function formatCompactCurrency(
  value: number,
) {
  return new Intl.NumberFormat(
    "es-PE",
    {
      notation: "compact",
      maximumFractionDigits: 1,
    },
  ).format(value);
}


function formatNumber(
  value: number,
) {
  return new Intl.NumberFormat(
    "es-PE",
    {
      maximumFractionDigits: 2,
    },
  ).format(value);
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
      dateStyle: "medium",
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
      month: "short",
    },
  ).format(date);
}


function normalize(
  value:
    | string
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


function translateStatus(
  value: string,
) {
  const dictionary:
    Record<string, string> = {
      ready: "Disponible",
      completed: "Completado",
      complete: "Completado",
      pending: "Pendiente",
      processing: "Procesando",
      generating: "Generando",
      failed: "Error",
      error: "Error",
      active: "Activo",
      inactive: "Inactivo",
    };

  return (
    dictionary[
      normalize(value)
    ]
    ?? value
  );
}


function translateReportType(
  value: string,
) {
  const normalized =
    normalize(value)
      .replace(
        /[-_]+/g,
        " ",
      );

  const dictionary:
    Record<string, string> = {
      sales: "Ventas",
      sale: "Ventas",
      inventory: "Inventario",
      stock: "Inventario",
      customers: "Clientes",
      customer: "Clientes",
      products: "Productos",
      product: "Productos",
      revenue: "Ingresos",
      analytics: "Analítica",
      commercial: "Comercial",

      "daily sales":
        "Ventas diarias",

      "monthly sales":
        "Ventas mensuales",

      "sales summary":
        "Resumen de ventas",

      "inventory report":
        "Reporte de inventario",
    };

  if (
    dictionary[normalized]
  ) {
    return dictionary[
      normalized
    ];
  }

  const clean =
    normalized
      .charAt(0)
      .toUpperCase()
    + normalized.slice(1);

  return clean;
}


function statusClass(
  value: string,
) {
  const status =
    normalize(value);

  if (
    status === "ready"
    || status === "completed"
    || status === "complete"
  ) {
    return "reports-status success";
  }

  if (
    status === "pending"
    || status === "processing"
    || status === "generating"
  ) {
    return "reports-status pending";
  }

  if (
    status === "failed"
    || status === "error"
  ) {
    return "reports-status error";
  }

  return "reports-status";
}


export default function ReportsPage() {
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
    exportSuccess,
    setExportSuccess,
  ] =
    useState("");


  const initialStart =
    dateOffset(-29);

  const initialEnd =
    dateOffset(0);


  const [
    startDate,
    setStartDate,
  ] =
    useState(
      initialStart,
    );

  const [
    endDate,
    setEndDate,
  ] =
    useState(
      initialEnd,
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
    analyticsLoading,
    setAnalyticsLoading,
  ] =
    useState(true);

  const [
    analyticsError,
    setAnalyticsError,
  ] =
    useState("");


  const {
    data: reportsData,
    loading: reportsLoading,
    error: reportsError,
    reload: reloadReports,
  } =
    useApiResource<
      ReportItem[]
    >(getReports);


  const [
    reportSearch,
    setReportSearch,
  ] =
    useState("");


  async function loadDashboard(
    from = startDate,
    to = endDate,
  ) {
    setAnalyticsLoading(
      true,
    );

    setAnalyticsError(
      "",
    );

    try {
      const response =
        await getAnalyticsDashboard(
          from,
          to,
        );

      setDashboard(
        response,
      );
    } catch (
      currentError
    ) {
      setDashboard(
        null,
      );

      setAnalyticsError(
        currentError
          instanceof Error
          ? currentError.message
          : "No se pudo cargar la información del reporte.",
      );
    } finally {
      setAnalyticsLoading(
        false,
      );
    }
  }


  useEffect(
    () => {
      void loadDashboard(
        initialStart,
        initialEnd,
      );
    },
    [],
  );


  const dailySales =
    dashboard
      ?.daily_sales
    ?? [];


  const totalSales =
    dashboard
      ?.summary
      .total_sales
    ?? 0;


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
      ? totalRevenue
        / activeDays
      : 0;


  const chartData =
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
          item.sales_count,
      }),
    );


  const topDays =
    useMemo(
      () =>
        [...chartData]
          .sort(
            (
              left,
              right,
            ) =>
              right.revenue
              - left.revenue,
          )
          .slice(
            0,
            5,
          ),
      [chartData],
    );


  const bestDay =
    topDays[0]
    ?? null;


  const reports =
    reportsData
    ?? [];


  const filteredReports =
    useMemo(
      () => {
        const query =
          normalize(
            reportSearch,
          );

        if (!query) {
          return reports;
        }

        return reports.filter(
          (report) =>
            normalize(
              report.name,
            ).includes(
              query,
            )
            || normalize(
              report.report_type,
            ).includes(
              query,
            )
            || normalize(
              report.status,
            ).includes(
              query,
            ),
        );
      },
      [
        reports,
        reportSearch,
      ],
    );


  function structuredExportRows(): ExportRow[] {
    const rows: ExportRow[] = [];


    if (
      dashboard
    ) {
      rows.push(
        {
          Sección:
            "Resumen",
          Métrica:
            "Ingresos totales",
          Valor:
            totalRevenue,
          Desde:
            startDate,
          Hasta:
            endDate,
        },
        {
          Sección:
            "Resumen",
          Métrica:
            "Ventas",
          Valor:
            totalSales,
          Desde:
            startDate,
          Hasta:
            endDate,
        },
        {
          Sección:
            "Resumen",
          Métrica:
            "Ticket promedio",
          Valor:
            averageTicket,
          Desde:
            startDate,
          Hasta:
            endDate,
        },
        {
          Sección:
            "Resumen",
          Métrica:
            "Ticket mediano",
          Valor:
            medianTicket,
          Desde:
            startDate,
          Hasta:
            endDate,
        },
        {
          Sección:
            "Resumen",
          Métrica:
            "Promedio diario",
          Valor:
            averageDailyRevenue,
          Desde:
            startDate,
          Hasta:
            endDate,
        },
      );


      chartData.forEach(
        (item) => {
          rows.push({
            Sección:
              "Desempeño diario",

            Fecha:
              item.date,

            Ventas:
              item.sales,

            Ingresos:
              item.revenue,

            Desde:
              startDate,

            Hasta:
              endDate,
          });
        },
      );
    }


    filteredReports.forEach(
      (report) => {
        rows.push({
          Sección:
            "Reporte registrado",

          Reporte:
            report.name,

          Tipo:
            translateReportType(
              report.report_type,
            ),

          Estado:
            translateStatus(
              report.status,
            ),

          Fecha:
            formatDate(
              report.created_at,
            ),

          Archivo:
            report.file_url
            || "No disponible",
        });
      },
    );


    return rows;
  }


  function exportFilename() {
    return `reportes-${startDate}-${endDate}-${exportDateStamp()}`;
  }


  async function handlePdf() {
    if (
      !exportRef.current
    ) {
      return;
    }


    setExportError("");
    setExportSuccess("");


    try {
      await downloadVisualPdf(
        exportRef.current,
        exportFilename(),
      );
    } catch (currentError) {
      setExportError(
        currentError instanceof Error
          ? currentError.message
          : "No se pudo generar el PDF.",
      );
    }
  }


  function handleCsv() {
    setExportError("");
    setExportSuccess("");


    try {
      exportRowsToCsv(
        exportFilename(),
        structuredExportRows(),
      );
    } catch (currentError) {
      setExportError(
        currentError instanceof Error
          ? currentError.message
          : "No se pudo generar el CSV.",
      );
    }
  }


  async function handleExcel() {
    setExportError("");
    setExportSuccess("");


    try {
      await exportRowsToExcel(
        exportFilename(),
        "Reportes",
        structuredExportRows(),
      );
    } catch (currentError) {
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
    setExportSuccess("");


    try {
      const file =
        await createVisualPdfFile(
          exportRef.current,
          exportFilename(),
        );


      const result =
        await shareFile(
          file,
          "Reportes - SalesIA Enterprise",
          `Reporte empresarial del ${startDate} al ${endDate}.`,
        );


      if (
        result === "downloaded"
      ) {
        setExportSuccess(
          "El PDF fue descargado para que puedas compartirlo manualmente.",
        );
      }
    } catch (currentError) {
      setExportError(
        currentError instanceof Error
          ? currentError.message
          : "No se pudo compartir el reporte.",
      );
    }
  }


  function applyPeriod(
    days: number,
  ) {
    const from =
      dateOffset(
        -(days - 1),
      );

    const to =
      dateOffset(0);

    setStartDate(
      from,
    );

    setEndDate(
      to,
    );

    void loadDashboard(
      from,
      to,
    );
  }


  async function refreshAll() {
    await Promise.all([
      loadDashboard(),
      reloadReports(),
    ]);
  }


  return (
    <section
      ref={exportRef}
      className="reports-page"
    >
      <header className="reports-header">
        <div>
          <div className="reports-eyebrow">
            <FileText
              size={14}
            />

            Información empresarial
          </div>

          <h1>
            Reportes
          </h1>

          <p>
            Consulta el desempeño comercial
            del período y los reportes
            disponibles.
          </p>

          <span className="reports-period-caption">
            Período analizado: {startDate} al {endDate}
          </span>
        </div>


        <div
          className="reports-header-actions"
          data-export-hide="true"
        >
          <ExportActions
            disabled={
              analyticsLoading
              || reportsLoading
              || (
                !dashboard
                && filteredReports.length === 0
              )
            }
            onPdf={handlePdf}
            onCsv={handleCsv}
            onExcel={handleExcel}
            onShare={handleShare}
          />


          <button
            type="button"
            className="reports-refresh-button"
            disabled={
              analyticsLoading
              || reportsLoading
            }
            onClick={() => {
              void refreshAll();
            }}
          >
            <RefreshCw
              size={15}
            />

            Actualizar
          </button>
        </div>
      </header>


      <section
        className="reports-period-bar"
        data-export-hide="true"
      >
        <div className="reports-period-presets">
          <button
            type="button"
            onClick={() =>
              applyPeriod(7)
            }
          >
            7 días
          </button>

          <button
            type="button"
            onClick={() =>
              applyPeriod(30)
            }
          >
            30 días
          </button>

          <button
            type="button"
            onClick={() =>
              applyPeriod(90)
            }
          >
            90 días
          </button>
        </div>


        <div className="reports-date-field">
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
            ) =>
              setStartDate(
                event
                  .target
                  .value,
              )
            }
          />
        </div>


        <div className="reports-date-field">
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
            ) =>
              setEndDate(
                event
                  .target
                  .value,
              )
            }
          />
        </div>


        <button
          type="button"
          className="reports-apply-button"
          disabled={
            analyticsLoading
          }
          onClick={() => {
            void loadDashboard();
          }}
        >
          <CalendarRange
            size={14}
          />

          Aplicar
        </button>
      </section>


      {exportError && (
        <div
          className="reports-message-error"
          data-export-hide="true"
        >
          {exportError}
        </div>
      )}


      {exportSuccess && (
        <div
          className="reports-message-success"
          data-export-hide="true"
        >
          {exportSuccess}
        </div>
      )}


      {analyticsError && (
        <div className="reports-message-error">
          {analyticsError}
        </div>
      )}


      {!analyticsLoading &&
        dashboard && (
          <>
            <section className="reports-kpi-grid">
              <article className="reports-kpi">
                <div className="reports-kpi-icon">
                  <Banknote
                    size={18}
                  />
                </div>

                <div>
                  <span>
                    INGRESOS
                  </span>

                  <strong>
                    {formatCurrency(
                      totalRevenue,
                    )}
                  </strong>

                  <small>
                    Total del período
                  </small>
                </div>
              </article>


              <article className="reports-kpi">
                <div className="reports-kpi-icon">
                  <ShoppingCart
                    size={18}
                  />
                </div>

                <div>
                  <span>
                    VENTAS
                  </span>

                  <strong>
                    {formatNumber(
                      totalSales,
                    )}
                  </strong>

                  <small>
                    Operaciones registradas
                  </small>
                </div>
              </article>


              <article className="reports-kpi">
                <div className="reports-kpi-icon">
                  <FileText
                    size={18}
                  />
                </div>

                <div>
                  <span>
                    TICKET PROMEDIO
                  </span>

                  <strong>
                    {formatCurrency(
                      averageTicket,
                    )}
                  </strong>

                  <small>
                    Importe medio por venta
                  </small>
                </div>
              </article>


              <article className="reports-kpi">
                <div className="reports-kpi-icon">
                  <Trophy
                    size={18}
                  />
                </div>

                <div>
                  <span>
                    PROMEDIO DIARIO
                  </span>

                  <strong>
                    {formatCurrency(
                      averageDailyRevenue,
                    )}
                  </strong>

                  <small>
                    Ingresos por día reportado
                  </small>
                </div>
              </article>
            </section>


            <section className="reports-main-grid">
              <article className="reports-chart-panel reports-revenue-panel">
                <div className="reports-panel-heading">
                  <div>
                    <span>
                      INGRESOS
                    </span>

                    <h2>
                      Evolución de ingresos
                    </h2>

                    <p>
                      Ingresos diarios dentro
                      del período seleccionado.
                    </p>
                  </div>
                </div>


                <div className="reports-chart-large">
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
                        right: 18,
                        left: 0,
                        bottom: 0,
                      }}
                    >
                      <defs>
                        <linearGradient
                          id="reportsRevenueFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#0ea5b7"
                            stopOpacity={0.28}
                          />

                          <stop
                            offset="95%"
                            stopColor="#0ea5b7"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={
                          false
                        }
                        stroke="#e8edf1"
                      />

                      <XAxis
                        dataKey="label"
                        tickLine={
                          false
                        }
                        axisLine={
                          false
                        }
                        fontSize={
                          9
                        }
                      />

                      <YAxis
                        tickLine={
                          false
                        }
                        axisLine={
                          false
                        }
                        width={55}
                        fontSize={
                          9
                        }
                        tickFormatter={(
                          value,
                        ) =>
                          formatCompactCurrency(
                            Number(
                              value,
                            ),
                          )
                        }
                      />

                      <Tooltip
                        formatter={(
                          value,
                        ) => [
                          formatCurrency(
                            Number(
                              value,
                            ),
                          ),
                          "Ingresos",
                        ]}
                      />

                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#0e8194"
                        strokeWidth={2}
                        fill="url(#reportsRevenueFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </article>


              <article className="reports-summary-panel">
                <div className="reports-panel-heading">
                  <div>
                    <span>
                      RESUMEN
                    </span>

                    <h2>
                      Resultado del período
                    </h2>
                  </div>
                </div>


                <div className="reports-summary-list">
                  <div>
                    <span>
                      Días reportados
                    </span>

                    <strong>
                      {activeDays}
                    </strong>
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
                  </div>

                  <div>
                    <span>
                      Ticket mediano
                    </span>

                    <strong>
                      {formatCurrency(
                        medianTicket,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Mejor día
                    </span>

                    <strong>
                      {bestDay
                        ? formatDate(
                            bestDay.date,
                          )
                        : "—"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Ingreso del mejor día
                    </span>

                    <strong>
                      {bestDay
                        ? formatCurrency(
                            bestDay.revenue,
                          )
                        : "—"}
                    </strong>
                  </div>
                </div>
              </article>
            </section>


            <section className="reports-secondary-grid">
              <article className="reports-chart-panel">
                <div className="reports-panel-heading">
                  <div>
                    <span>
                      OPERACIONES
                    </span>

                    <h2>
                      Ventas por día
                    </h2>
                  </div>
                </div>


                <div className="reports-chart-medium">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={
                        chartData
                      }
                      margin={{
                        top: 12,
                        right: 15,
                        left: 0,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={
                          false
                        }
                        stroke="#e8edf1"
                      />

                      <XAxis
                        dataKey="label"
                        tickLine={
                          false
                        }
                        axisLine={
                          false
                        }
                        fontSize={
                          9
                        }
                      />

                      <YAxis
                        tickLine={
                          false
                        }
                        axisLine={
                          false
                        }
                        fontSize={
                          9
                        }
                        allowDecimals={
                          false
                        }
                      />

                      <Tooltip />

                      <Bar
                        dataKey="sales"
                        name="Ventas"
                        fill="#2563eb"
                        radius={[
                          5,
                          5,
                          0,
                          0,
                        ]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>


              <article className="reports-chart-panel">
                <div className="reports-panel-heading">
                  <div>
                    <span>
                      RANKING
                    </span>

                    <h2>
                      Días con mayores ingresos
                    </h2>
                  </div>
                </div>


                <div className="reports-chart-medium">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={
                        topDays
                      }
                      layout="vertical"
                      margin={{
                        top: 12,
                        right: 20,
                        left: 15,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={
                          false
                        }
                        stroke="#e8edf1"
                      />

                      <XAxis
                        type="number"
                        tickLine={
                          false
                        }
                        axisLine={
                          false
                        }
                        fontSize={
                          9
                        }
                        tickFormatter={(
                          value,
                        ) =>
                          formatCompactCurrency(
                            Number(
                              value,
                            ),
                          )
                        }
                      />

                      <YAxis
                        type="category"
                        dataKey="label"
                        tickLine={
                          false
                        }
                        axisLine={
                          false
                        }
                        width={60}
                        fontSize={
                          9
                        }
                      />

                      <Tooltip
                        formatter={(
                          value,
                        ) => [
                          formatCurrency(
                            Number(
                              value,
                            ),
                          ),
                          "Ingresos",
                        ]}
                      />

                      <Bar
                        dataKey="revenue"
                        name="Ingresos"
                        fill="#0ea5b7"
                        radius={[
                          0,
                          5,
                          5,
                          0,
                        ]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>
            </section>
          </>
        )}


      {analyticsLoading && (
        <section className="reports-loading-analytics">
          <div className="reports-spinner" />

          <strong>
            Preparando reporte
          </strong>
        </section>
      )}


      <section className="reports-files-panel">
        <div className="reports-files-header">
          <div>
            <span>
              ARCHIVOS
            </span>

            <h2>
              Reportes disponibles
            </h2>
          </div>


          <div
            className="reports-search"
            data-export-hide="true"
          >
            <Search
              size={14}
            />

            <input
              type="search"
              value={
                reportSearch
              }
              onChange={(
                event,
              ) =>
                setReportSearch(
                  event
                    .target
                    .value,
                )
              }
              placeholder="Buscar reporte..."
            />
          </div>
        </div>


        {reportsLoading ? (
          <div className="reports-files-state">
            Cargando reportes...
          </div>
        ) : reportsError ? (
          <div className="reports-files-state error">
            {reportsError}
          </div>
        ) : filteredReports.length ===
          0 ? (
          <div className="reports-files-state">
            No hay reportes disponibles.
          </div>
        ) : (
          <div className="reports-table-wrap">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>
                    Reporte
                  </th>

                  <th>
                    Tipo
                  </th>

                  <th>
                    Estado
                  </th>

                  <th>
                    Fecha
                  </th>

                  <th data-export-hide="true">
                    Archivo
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredReports.map(
                  (
                    report,
                  ) => (
                    <tr
                      key={
                        String(
                          report.id,
                        )
                      }
                    >
                      <td>
                        <div className="reports-name">
                          <FileText
                            size={15}
                          />

                          <strong>
                            {
                              report
                                .name
                            }
                          </strong>
                        </div>
                      </td>

                      <td>
                        {translateReportType(
                          report
                            .report_type,
                        )}
                      </td>

                      <td>
                        <span
                          className={
                            statusClass(
                              report
                                .status,
                            )
                          }
                        >
                          {translateStatus(
                            report
                              .status,
                          )}
                        </span>
                      </td>

                      <td>
                        {formatDate(
                          report
                            .created_at,
                        )}
                      </td>

                      <td data-export-hide="true">
                        {report.file_url ? (
                          <a
                            className="reports-open-link"
                            href={
                              report
                                .file_url
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink
                              size={13}
                            />

                            Abrir
                          </a>
                        ) : (
                          <span className="reports-no-file">
                            No disponible
                          </span>
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
