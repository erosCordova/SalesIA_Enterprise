import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CalendarDays,
  Package,
  ReceiptText,
  ShoppingBag,
  TrendingUp,
  UsersRound,
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
import StatCard from "../../components/ui/StatCard";

import {
  apiFetch,
} from "../../services/api";

import {
  createVisualPdfFile,
  downloadVisualPdf,
  exportDateStamp,
  exportRowsToCsv,
  exportRowsToExcel,
  shareFile,
  type ExportRow,
} from "../../utils/exporting";


interface DashboardSummary {
  sales_count?:
    number | null;

  revenue?:
    number | null;

  active_customers?:
    number | null;

  average_ticket?:
    number | null;

  products_count?:
    number | null;

  low_stock_count?:
    number | null;

  growth_percentage?:
    number | null;

  sales_by_day?: Array<{
    day?: string;
    sales?: number;
    revenue?: number;
  }> | null;

  recent_sales?: Array<{
    id?: string;
    sale_number?: string;
    customer_name?: string;
    sale_date?: string;
    total?: number;
    status?: string;
  }> | null;

  stock_alerts?: Array<{
    product_name?: string;
    stock_quantity?: number;
    stock_status?: string;
  }> | null;

  scope?: string;
}


function numberValue(
  value: unknown,
): number {
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
      style:
        "currency",

      currency:
        "PEN",

      minimumFractionDigits:
        2,
    },
  ).format(
    numberValue(
      value,
    ),
  );
}


function formatNumber(
  value: unknown,
) {
  return new Intl.NumberFormat(
    "es-PE",
  ).format(
    numberValue(
      value,
    ),
  );
}


function formatDate(
  value?: string,
) {
  if (!value) {
    return "Fecha no disponible";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Fecha no disponible";
  }

  return date.toLocaleDateString(
    "es-PE",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",
    },
  );
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

  return date.toLocaleDateString(
    "es-PE",
    {
      day:
        "2-digit",

      month:
        "short",
    },
  );
}


function normalizeSaleStatus(
  status?: string,
) {
  switch (
    status?.toLowerCase()
  ) {
    case "completed":
      return "Completada";

    case "cancelled":
    case "canceled":
      return "Cancelada";

    case "pending":
      return "Pendiente";

    default:
      return (
        status
        || "Registrada"
      );
  }
}


function DashboardLoading() {
  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">
            CENTRO DE CONTROL
          </span>

          <h1>
            Dashboard ejecutivo
          </h1>

          <p>
            Cargando información empresarial...
          </p>
        </div>
      </div>


      <div className="stats-grid">
        {[
          1,
          2,
          3,
          4,
        ].map(
          (
            item,
          ) => (
            <div
              key={
                item
              }
              className="dashboard-skeleton-card"
            />
          ),
        )}
      </div>


      <div className="dashboard-skeleton-panel" />
    </section>
  );
}


function DashboardError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <section className="dashboard-page">
      <div className="dashboard-error-state">
        <div className="dashboard-error-icon">
          <AlertTriangle
            size={24}
          />
        </div>

        <h2>
          No fue posible cargar el dashboard
        </h2>

        <p>
          {message}
        </p>

        <button
          type="button"
          className="dashboard-retry-button"
          onClick={
            onRetry
          }
        >
          Reintentar
        </button>
      </div>
    </section>
  );
}


function DashboardEmpty() {
  return (
    <section className="dashboard-page">
      <div className="dashboard-empty-state">
        <Package
          size={30}
        />

        <h2>
          Sin información disponible
        </h2>

        <p>
          No existe información disponible
          para mostrar en el dashboard.
        </p>
      </div>
    </section>
  );
}


function DashboardPage() {
  const exportRef =
    useRef<HTMLElement>(
      null,
    );


  const [
    summary,
    setSummary,
  ] =
    useState<
      DashboardSummary | null
    >(
      null,
    );


  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );


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


  const loadDashboard =
    useCallback(
      async () => {
        setLoading(
          true,
        );

        setError(
          "",
        );

        setExportError(
          "",
        );

        try {
          const data =
            await apiFetch<
              DashboardSummary
            >(
              "/dashboard/summary",
            );

          setSummary(
            data || {},
          );
        } catch (
          currentError
        ) {
          console.error(
            "Error Dashboard:",
            currentError,
          );

          setSummary(
            null,
          );

          setError(
            currentError
              instanceof Error
              ? currentError.message
              : "No fue posible obtener la información del dashboard.",
          );
        } finally {
          setLoading(
            false,
          );
        }
      },
      [],
    );


  useEffect(
    () => {
      void loadDashboard();
    },
    [
      loadDashboard,
    ],
  );


  const dashboardData =
    useMemo(
      () => {
        const salesCount =
          numberValue(
            summary
              ?.sales_count,
          );

        const revenue =
          numberValue(
            summary
              ?.revenue,
          );

        const activeCustomers =
          numberValue(
            summary
              ?.active_customers,
          );

        const averageTicket =
          numberValue(
            summary
              ?.average_ticket,
          );

        const productsCount =
          numberValue(
            summary
              ?.products_count,
          );

        const lowStockCount =
          numberValue(
            summary
              ?.low_stock_count,
          );

        const growth =
          numberValue(
            summary
              ?.growth_percentage,
          );


        const salesByDay =
          Array.isArray(
            summary
              ?.sales_by_day,
          )
            ? summary
                .sales_by_day
            : [];


        const recentSales =
          Array.isArray(
            summary
              ?.recent_sales,
          )
            ? summary
                .recent_sales
            : [];


        const stockAlerts =
          Array.isArray(
            summary
              ?.stock_alerts,
          )
            ? summary
                .stock_alerts
            : [];


        const chartData =
          salesByDay.map(
            (
              item,
              index,
            ) => ({
              day:
                item.day
                  ? formatChartDate(
                      item.day,
                    )
                  : `Día ${index + 1}`,

              rawDay:
                item.day
                ?? "",

              revenue:
                numberValue(
                  item.revenue,
                ),

              sales:
                numberValue(
                  item.sales,
                ),
            }),
          );


        return {
          salesCount,
          revenue,
          activeCustomers,
          averageTicket,
          productsCount,
          lowStockCount,
          growth,
          salesByDay,
          recentSales,
          stockAlerts,
          chartData,
        };
      },
      [
        summary,
      ],
    );


  if (
    loading
  ) {
    return (
      <DashboardLoading />
    );
  }


  if (
    error
  ) {
    return (
      <DashboardError
        message={
          error
        }
        onRetry={
          loadDashboard
        }
      />
    );
  }


  if (
    !summary
  ) {
    return (
      <DashboardEmpty />
    );
  }


  const {
    salesCount,
    revenue,
    activeCustomers,
    averageTicket,
    productsCount,
    lowStockCount,
    growth,
    salesByDay,
    recentSales,
    stockAlerts,
    chartData,
  } =
    dashboardData;


  const growthPositive =
    growth >= 0;


  function exportRows():
    ExportRow[] {
    const rows:
      ExportRow[] = [
      {
        Sección:
          "Resumen",

        Indicador:
          "Ventas registradas",

        Valor:
          salesCount,
      },
      {
        Sección:
          "Resumen",

        Indicador:
          "Ingresos",

        Valor:
          revenue,
      },
      {
        Sección:
          "Resumen",

        Indicador:
          "Clientes activos",

        Valor:
          activeCustomers,
      },
      {
        Sección:
          "Resumen",

        Indicador:
          "Ticket promedio",

        Valor:
          averageTicket,
      },
      {
        Sección:
          "Resumen",

        Indicador:
          "Crecimiento (%)",

        Valor:
          growth,
      },
      {
        Sección:
          "Inventario",

        Indicador:
          "Productos activos",

        Valor:
          productsCount,
      },
      {
        Sección:
          "Inventario",

        Indicador:
          "Productos con alerta",

        Valor:
          lowStockCount,
      },
    ];


    salesByDay.forEach(
      (
        item,
      ) => {
        rows.push({
          Sección:
            "Ingresos por día",

          Fecha:
            item.day
            ?? "",

          Ventas:
            numberValue(
              item.sales,
            ),

          Ingresos:
            numberValue(
              item.revenue,
            ),
        });
      },
    );


    recentSales.forEach(
      (
        sale,
      ) => {
        rows.push({
          Sección:
            "Ventas recientes",

          Venta:
            sale.sale_number
            ?? sale.id
            ?? "",

          Fecha:
            sale.sale_date
            ?? "",

          Cliente:
            sale.customer_name
            ?? "Cliente no especificado",

          Total:
            numberValue(
              sale.total,
            ),

          Estado:
            normalizeSaleStatus(
              sale.status,
            ),
        });
      },
    );


    stockAlerts.forEach(
      (
        alert,
      ) => {
        rows.push({
          Sección:
            "Alertas de stock",

          Producto:
            alert.product_name
            ?? "",

          Stock:
            numberValue(
              alert.stock_quantity,
            ),

          Estado:
            alert.stock_status
            ?? "Stock bajo",
        });
      },
    );


    return rows;
  }


  function exportFilename() {
    return (
      `dashboard-ejecutivo-${exportDateStamp()}`
    );
  }


  async function handlePdf() {
    if (
      !exportRef.current
    ) {
      return;
    }


    setExportError(
      "",
    );


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
    setExportError(
      "",
    );


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
    setExportError(
      "",
    );


    try {
      await exportRowsToExcel(
        exportFilename(),
        "Dashboard",
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


    setExportError(
      "",
    );


    try {
      const file =
        await createVisualPdfFile(
          exportRef.current,
          exportFilename(),
        );


      await shareFile(
        file,
        "Dashboard ejecutivo - SalesIA Enterprise",
        "Resumen ejecutivo de SalesIA Enterprise.",
      );
    } catch (
      currentError
    ) {
      setExportError(
        currentError
          instanceof Error
          ? currentError.message
          : "No se pudo compartir el Dashboard.",
      );
    }
  }


  return (
    <section
      ref={
        exportRef
      }
      className="dashboard-page"
    >
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">
            CENTRO DE CONTROL
          </span>

          <h1>
            Dashboard ejecutivo
          </h1>

          <p>
            Resumen general de la actividad
            comercial, ingresos, clientes e
            inventario de SalesIA Enterprise.
          </p>
        </div>


        <div
          className="dashboard-heading-actions"
          data-export-hide="true"
        >
          <ExportActions
            disabled={
              false
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
            className="date-filter-button"
          >
            <CalendarDays
              size={17}
            />

            Últimos 30 días
          </button>
        </div>
      </div>


      {exportError && (
        <div
          className="dashboard-export-error"
          data-export-hide="true"
        >
          {exportError}
        </div>
      )}


      <div className="dashboard-highlight">
        <div>
          <span>
            RESUMEN COMERCIAL
          </span>

          <h2>
            Información empresarial actualizada
            directamente desde SalesIA.
          </h2>

          <p>
            Los indicadores muestran el
            comportamiento de los últimos 30 días
            y se comparan con el período
            inmediatamente anterior.
          </p>
        </div>


        <div className="highlight-metric">
          <TrendingUp
            size={21}
          />

          <div>
            <strong>
              {growth > 0
                ? "+"
                : ""}
              {growth.toFixed(
                1,
              )}
              %
            </strong>

            <span>
              crecimiento vs. período anterior
            </span>
          </div>
        </div>
      </div>


      <div className="stats-grid">
        <StatCard
          title="Ventas registradas"
          value={
            formatNumber(
              salesCount,
            )
          }
          change={
            `${growth > 0 ? "+" : ""}${growth.toFixed(1)}%`
          }
          positive={
            growthPositive
          }
          caption="vs. período anterior"
          icon={
            ShoppingBag
          }
        />


        <StatCard
          title="Ingresos"
          value={
            formatCurrency(
              revenue,
            )
          }
          change={
            `${growth > 0 ? "+" : ""}${growth.toFixed(1)}%`
          }
          positive={
            growthPositive
          }
          caption="últimos 30 días"
          icon={
            Banknote
          }
        />


        <StatCard
          title="Clientes activos"
          value={
            formatNumber(
              activeCustomers,
            )
          }
          change="—"
          positive
          caption="clientes registrados"
          icon={
            UsersRound
          }
        />


        <StatCard
          title="Ticket promedio"
          value={
            formatCurrency(
              averageTicket,
            )
          }
          change="—"
          positive
          caption="promedio por venta"
          icon={
            ReceiptText
          }
        />
      </div>


      <div className="dashboard-main-grid">
        <article className="panel panel-large">
          <div className="panel-header">
            <div>
              <span className="panel-label">
                RENDIMIENTO
              </span>

              <h3>
                Ingresos por día
              </h3>
            </div>


            <div className="panel-total">
              <span>
                Total del período
              </span>

              <strong>
                {formatCurrency(
                  revenue,
                )}
              </strong>
            </div>
          </div>


          <div className="chart-container">
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
                >
                  <defs>
                    <linearGradient
                      id="salesGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#2563EB"
                        stopOpacity={
                          0.24
                        }
                      />

                      <stop
                        offset="100%"
                        stopColor="#2563EB"
                        stopOpacity={
                          0.02
                        }
                      />
                    </linearGradient>
                  </defs>


                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={
                      false
                    }
                    stroke="#E9EEF5"
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
                        11,
                    }}
                    minTickGap={
                      24
                    }
                  />


                  <YAxis
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
                        11,
                    }}
                    tickFormatter={(
                      value,
                    ) =>
                      `S/ ${numberValue(
                        value,
                      ).toLocaleString(
                        "es-PE",
                        {
                          maximumFractionDigits:
                            0,
                        },
                      )}`
                    }
                  />


                  <Tooltip
                    formatter={(
                      value,
                      name,
                    ) => {
                      if (
                        name ===
                        "Ingresos"
                      ) {
                        return [
                          formatCurrency(
                            value,
                          ),
                          "Ingresos",
                        ];
                      }

                      return [
                        value,
                        name,
                      ];
                    }}
                    labelFormatter={(
                      label,
                    ) =>
                      `Fecha: ${label}`
                    }
                  />


                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Ingresos"
                    stroke="#2563EB"
                    strokeWidth={
                      2.5
                    }
                    fill="url(#salesGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="dashboard-chart-empty">
                <Package
                  size={24}
                />

                <span>
                  No hay datos diarios disponibles.
                </span>
              </div>
            )}
          </div>
        </article>


        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="panel-label">
                OPERACIÓN
              </span>

              <h3>
                Ventas recientes
              </h3>
            </div>

            <ArrowRight
              size={18}
            />
          </div>


          <div className="dashboard-list">
            {recentSales.length ===
            0 ? (
              <div className="dashboard-list-empty">
                No hay ventas recientes.
              </div>
            ) : (
              recentSales.map(
                (
                  sale,
                  index,
                ) => {
                  const saleKey =
                    sale.id
                    || sale.sale_number
                    || `Venta-${index + 1}`;


                  const saleNumber =
                    sale.sale_number
                    || `Venta ${index + 1}`;


                  const customer =
                    sale.customer_name
                    || "Cliente no especificado";


                  const date =
                    formatDate(
                      sale.sale_date,
                    );


                  const amount =
                    sale.total
                    ?? 0;


                  return (
                    <div
                      className="dashboard-list-item"
                      key={
                        saleKey
                      }
                    >
                      <div>
                        <strong>
                          {saleNumber}
                        </strong>

                        <span>
                          {customer}
                        </span>

                        <small>
                          {date}
                        </small>
                      </div>


                      <div className="dashboard-list-value">
                        <strong>
                          {formatCurrency(
                            amount,
                          )}
                        </strong>

                        <span>
                          {normalizeSaleStatus(
                            sale.status,
                          )}
                        </span>
                      </div>
                    </div>
                  );
                },
              )
            )}
          </div>
        </article>


        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="panel-label">
                INVENTARIO
              </span>

              <h3>
                Alertas de stock
              </h3>
            </div>

            <AlertTriangle
              size={18}
            />
          </div>


          <div className="dashboard-list">
            {stockAlerts.length ===
            0 ? (
              <div className="dashboard-list-empty">
                No hay alertas de inventario.
              </div>
            ) : (
              stockAlerts.map(
                (
                  alert,
                  index,
                ) => {
                  const product =
                    alert.product_name
                    || `Producto ${index + 1}`;


                  const stock =
                    numberValue(
                      alert.stock_quantity,
                    );


                  const level =
                    alert.stock_status
                    || "Stock bajo";


                  return (
                    <div
                      className="dashboard-list-item"
                      key={
                        `${product}-${index}`
                      }
                    >
                      <div>
                        <strong>
                          {product}
                        </strong>

                        <span>
                          Stock disponible:
                          {" "}
                          {formatNumber(
                            stock,
                          )}
                        </span>
                      </div>


                      <div className="dashboard-alert-level">
                        <span>
                          {level}
                        </span>
                      </div>
                    </div>
                  );
                },
              )
            )}
          </div>
        </article>
      </div>


      <div className="dashboard-highlight">
        <div>
          <span>
            ESTADO DEL NEGOCIO
          </span>

          <h2>
            Resumen operativo del inventario
          </h2>

          <p>
            SalesIA supervisa productos activos
            y existencias para detectar
            situaciones que requieren atención.
          </p>
        </div>


        <div className="highlight-metric">
          <Package
            size={21}
          />

          <div>
            <strong>
              {formatNumber(
                productsCount,
              )}
            </strong>

            <span>
              productos activos ·
              {" "}
              {formatNumber(
                lowStockCount,
              )}
              {" "}
              con alerta
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}


export default DashboardPage;
