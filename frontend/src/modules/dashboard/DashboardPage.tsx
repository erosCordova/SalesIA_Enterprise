import {
  Activity,
  AlertTriangle,
  Boxes,
  CalendarDays,
  ChevronRight,
  PackageCheck,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  UsersRound,
} from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import ExportActions from "../../components/ui/ExportActions";
import ModuleState from "../../components/ui/ModuleState";

import {
  apiFetch,
} from "../../services/api";

import {
  getProducts,
} from "../../services/commercial.service";

import type {
  Product,
} from "../../types/commercial";

import {
  createVisualPdfFile,
  downloadVisualPdf,
  exportDateStamp,
  exportRowsToCsv,
  exportRowsToExcel,
  shareFile,
  type ExportRow,
} from "../../utils/exporting";

import "./dashboard-reference.css";


interface DashboardSummary {
  sales_count?: number | null;

  revenue?: number | null;

  active_customers?: number | null;

  average_ticket?: number | null;

  products_count?: number | null;

  low_stock_count?: number | null;

  growth_percentage?: number | null;

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
    },
  ).format(
    numberValue(value),
  );
}


function formatNumber(
  value: unknown,
) {
  return new Intl.NumberFormat(
    "es-PE",
  ).format(
    numberValue(value),
  );
}


function formatPercent(
  value: number,
) {
  return `${value.toFixed(1)}%`;
}


function formatChartDate(
  value?: string,
) {
  if (!value) {
    return "";
  }

  const normalized =
    value.includes("T")
      ? value
      : `${value}T00:00:00`;

  const date =
    new Date(normalized);

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
      day: "2-digit",
      month: "short",
    },
  );
}


function DashboardPage() {
  const exportRef =
    useRef<HTMLElement | null>(
      null,
    );

  const [
    summary,
    setSummary,
  ] =
    useState<DashboardSummary | null>(
      null,
    );

  const [
    products,
    setProducts,
  ] =
    useState<Product[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    operationError,
    setOperationError,
  ] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState("");


  const loadDashboard =
    useCallback(
      async () => {
        setLoading(true);
        setError("");

        try {
          const [
            dashboardData,
            productsData,
          ] =
            await Promise.all([
              apiFetch<DashboardSummary>(
                "/dashboard/summary",
              ),
              getProducts(),
            ]);

          setSummary(
            dashboardData || {},
          );

          setProducts(
            Array.isArray(
              productsData,
            )
              ? productsData
              : [],
          );
        } catch (
          requestError
        ) {
          setError(
            requestError
              instanceof Error
              ? requestError.message
              : "No fue posible cargar el Dashboard.",
          );
        } finally {
          setLoading(false);
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


  const salesCount =
    numberValue(
      summary?.sales_count,
    );

  const revenue =
    numberValue(
      summary?.revenue,
    );

  const activeCustomers =
    numberValue(
      summary?.active_customers,
    );

  const growth =
    numberValue(
      summary?.growth_percentage,
    );

  const productCount =
    products.length > 0
      ? products.length
      : numberValue(
          summary?.products_count,
        );


  const chartData =
    useMemo(
      () =>
        (
          summary?.sales_by_day
          ?? []
        ).map(
          (
            item,
            index,
          ) => ({
            day:
              formatChartDate(
                item.day,
              )
              || `${index + 1}`,

            revenue:
              numberValue(
                item.revenue,
              ),

            sales:
              numberValue(
                item.sales,
              ),
          }),
        ),
      [
        summary?.sales_by_day,
      ],
    );


  const inventoryState =
    useMemo(
      () => {
        let healthy = 0;
        let low = 0;
        let empty = 0;

        products.forEach(
          (product) => {
            const stock =
              numberValue(
                product.stock_quantity,
              );

            const minimum =
              numberValue(
                product.minimum_stock,
              );

            if (
              stock <= 0
            ) {
              empty += 1;

              return;
            }

            if (
              stock <= minimum
            ) {
              low += 1;

              return;
            }

            healthy += 1;
          },
        );

        return {
          healthy,
          low,
          empty,
        };
      },
      [
        products,
      ],
    );


  const stockHealth =
    productCount > 0
      ? (
          inventoryState.healthy
          / productCount
        ) * 100
      : 0;


  const inventoryDistribution =
    useMemo(
      () => [
        {
          name:
            "Disponible",

          value:
            inventoryState.healthy,

          color:
            "#14b8a6",
        },

        {
          name:
            "Stock bajo",

          value:
            inventoryState.low,

          color:
            "#f59e0b",
        },

        {
          name:
            "Agotado",

          value:
            inventoryState.empty,

          color:
            "#ef4444",
        },
      ],
      [
        inventoryState,
      ],
    );


  const alertProducts =
    useMemo(
      () =>
        products
          .filter(
            (product) => {
              const stock =
                numberValue(
                  product.stock_quantity,
                );

              const minimum =
                numberValue(
                  product.minimum_stock,
                );

              return (
                stock <= minimum
              );
            },
          )
          .slice(
            0,
            3,
          ),
      [
        products,
      ],
    );


  const exportRows =
    useMemo<ExportRow[]>(
      () => {
        const rows:
          ExportRow[] = [
            {
              Sección:
                "Resumen ejecutivo",

              Indicador:
                "Ingresos",

              Valor:
                revenue,
            },
            {
              Sección:
                "Resumen ejecutivo",

              Indicador:
                "Ventas procesadas",

              Valor:
                salesCount,
            },
            {
              Sección:
                "Resumen ejecutivo",

              Indicador:
                "Clientes activos",

              Valor:
                activeCustomers,
            },
            {
              Sección:
                "Resumen ejecutivo",

              Indicador:
                "Salud de inventario",

              Valor:
                stockHealth,
            },
          ];

        chartData.forEach(
          (item) => {
            rows.push({
              Sección:
                "Tendencia",

              Indicador:
                item.day,

              Valor:
                item.revenue,
            });
          },
        );

        products.forEach(
          (product) => {
            rows.push({
              Sección:
                "Inventario",

              Indicador:
                product.name,

              Código:
                product.sku,

              Valor:
                numberValue(
                  product.stock_quantity,
                ),
            });
          },
        );

        return rows;
      },
      [
        revenue,
        salesCount,
        activeCustomers,
        stockHealth,
        chartData,
        products,
      ],
    );


  function filename() {
    return (
      `dashboard-salesia-${
        exportDateStamp()
      }`
    );
  }


  async function handlePdf() {
    if (
      !exportRef.current
    ) {
      return;
    }

    setOperationError("");

    try {
      await downloadVisualPdf(
        exportRef.current,
        filename(),
      );
    } catch (
      exportError
    ) {
      setOperationError(
        exportError
          instanceof Error
          ? exportError.message
          : "No se pudo generar el PDF.",
      );
    }
  }


  function handleCsv() {
    try {
      exportRowsToCsv(
        filename(),
        exportRows,
      );
    } catch (
      exportError
    ) {
      setOperationError(
        exportError
          instanceof Error
          ? exportError.message
          : "No se pudo generar el CSV.",
      );
    }
  }


  async function handleExcel() {
    try {
      await exportRowsToExcel(
        filename(),
        "Dashboard",
        exportRows,
      );
    } catch (
      exportError
    ) {
      setOperationError(
        exportError
          instanceof Error
          ? exportError.message
          : "No se pudo generar Excel.",
      );
    }
  }


  async function handleShare() {
    if (
      !exportRef.current
    ) {
      return;
    }

    try {
      const file =
        await createVisualPdfFile(
          exportRef.current,
          filename(),
        );

      const result =
        await shareFile(
          file,
          "Dashboard SalesIA",
          "Resumen ejecutivo de SalesIA Enterprise.",
        );

      if (
        result ===
        "downloaded"
      ) {
        setSuccessMessage(
          "El PDF fue descargado para compartirlo.",
        );
      }
    } catch (
      shareError
    ) {
      setOperationError(
        shareError
          instanceof Error
          ? shareError.message
          : "No se pudo compartir.",
      );
    }
  }


  if (loading) {
    return (
      <section className="executive-dashboard-page">
        <ModuleState
          type="loading"
          title="Cargando Dashboard"
          description="Consultando la información actual del negocio."
        />
      </section>
    );
  }


  if (error) {
    return (
      <section className="executive-dashboard-page">
        <ModuleState
          type="error"
          title="No se pudo cargar el Dashboard"
          description={error}
        />

        <button
          type="button"
          className="primary-button"
          onClick={() =>
            void loadDashboard()
          }
        >
          Reintentar
        </button>
      </section>
    );
  }


  return (
    <section
      ref={exportRef}
      className="executive-dashboard-page"
    >
      <div className="executive-breadcrumb">
        <span>
          1. Ejecutivo
        </span>

        <ChevronRight
          size={12}
        />

        <strong>
          DASHBOARD
        </strong>
      </div>


      <header className="executive-dashboard-header">
        <div>
          <h1>
            Dashboard
          </h1>

          <p>
            Resumen integral del estado comercial,
            operativo e inventario de SalesIA Enterprise.
          </p>
        </div>

        <div
          className="executive-header-actions"
          data-export-hide="true"
        >
                    <ExportActions
            disabled={false}
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
            className="executive-refresh"
            onClick={() =>
              void loadDashboard()
            }
          >
            <RefreshCw
              size={14}
            />

            Actualizar
          </button>
        </div>
      </header>


      {operationError && (
        <ModuleState
          type="error"
          title="No se pudo completar la operación"
          description={
            operationError
          }
        />
      )}


      {successMessage && (
        <ModuleState
          type="success"
          title="Operación completada"
          description={
            successMessage
          }
        />
      )}


      <div className="executive-kpi-grid">
        <article className="executive-kpi">
          <div className="executive-kpi-heading">
            <span>
              Ingresos del período
            </span>

            <div className="executive-kpi-icon cyan">
              <ShoppingCart
                size={16}
              />
            </div>
          </div>

          <strong>
            {formatCurrency(
              revenue,
            )}
          </strong>

          <small className="positive">
            <TrendingUp
              size={11}
            />

            {growth >= 0
              ? "+"
              : ""}
            {formatPercent(
              growth,
            )} vs. período anterior
          </small>
        </article>


        <article className="executive-kpi">
          <div className="executive-kpi-heading">
            <span>
              Ventas procesadas
            </span>

            <div className="executive-kpi-icon green">
              <PackageCheck
                size={16}
              />
            </div>
          </div>

          <strong>
            {formatNumber(
              salesCount,
            )}
          </strong>

          <small>
            operaciones registradas
          </small>
        </article>


        <article className="executive-kpi">
          <div className="executive-kpi-heading">
            <span>
              Salud del inventario
            </span>

            <div className="executive-kpi-icon purple">
              <Boxes
                size={16}
              />
            </div>
          </div>

          <strong>
            {formatPercent(
              stockHealth,
            )}
          </strong>

          <small>
            {formatNumber(
              inventoryState.healthy,
            )} productos disponibles
          </small>
        </article>


        <article className="executive-kpi">
          <div className="executive-kpi-heading">
            <span>
              Clientes activos
            </span>

            <div className="executive-kpi-icon blue">
              <UsersRound
                size={16}
              />
            </div>
          </div>

          <strong>
            {formatNumber(
              activeCustomers,
            )}
          </strong>

          <small>
            clientes registrados
          </small>
        </article>
      </div>


      <div className="executive-analysis-grid">
        <article className="executive-panel executive-trend-panel">
          <header className="executive-panel-header">
            <div>
              <h2>
                Tendencia de ingresos
              </h2>

              <p>
                Evolución registrada durante el período analizado.
              </p>
            </div>

            <div className="executive-period">
              <CalendarDays
                size={13}
              />

              Últimos 30 días
            </div>
          </header>


          <div className="executive-chart-legend">
            <span>
              <i />

              Ingresos registrados
            </span>
          </div>


          <div className="executive-main-chart">
            {chartData.length >
            0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <AreaChart
                  data={chartData}
                  margin={{
                    top: 12,
                    right: 10,
                    left: -10,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient
                      id="executiveIncomeGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#0ea5b7"
                        stopOpacity={0.24}
                      />

                      <stop
                        offset="100%"
                        stopColor="#0ea5b7"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    vertical={false}
                    stroke="#e8eef2"
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    minTickGap={22}
                    tick={{
                      fill:
                        "#7b8ba0",
                      fontSize:
                        8,
                    }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={60}
                    tick={{
                      fill:
                        "#7b8ba0",
                      fontSize:
                        8,
                    }}
                    tickFormatter={(
                      value,
                    ) =>
                      `S/ ${Number(
                        value,
                      ).toLocaleString(
                        "es-PE",
                      )}`
                    }
                  />

                  <Tooltip
                    formatter={(
                      value,
                    ) => [
                      formatCurrency(
                        value,
                      ),
                      "Ingresos",
                    ]}
                  />

                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0ea5b7"
                    strokeWidth={2}
                    fill="url(#executiveIncomeGradient)"
                    dot={false}
                    activeDot={{
                      r: 4,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="executive-empty-chart">
                No hay datos diarios disponibles.
              </div>
            )}
          </div>
        </article>


        <article className="executive-panel executive-distribution-panel">
          <header className="executive-panel-header compact">
            <div>
              <h2>
                Distribución de inventario
              </h2>

              <p>
                Estado actual del catálogo.
              </p>
            </div>
          </header>


          <div className="executive-donut">
            {productCount >
            0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={
                      inventoryDistribution
                    }
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={70}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {inventoryDistribution.map(
                      (
                        item,
                      ) => (
                        <Cell
                          key={
                            item.name
                          }
                          fill={
                            item.color
                          }
                        />
                      ),
                    )}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="executive-empty-chart">
                Sin productos.
              </div>
            )}

            {productCount >
              0 && (
              <div className="executive-donut-center">
                <strong>
                  {formatNumber(
                    productCount,
                  )}
                </strong>

                <span>
                  productos
                </span>
              </div>
            )}
          </div>


          <div className="executive-donut-legend">
            {inventoryDistribution.map(
              (item) => (
                <div
                  key={
                    item.name
                  }
                >
                  <i
                    style={{
                      background:
                        item.color,
                    }}
                  />

                  <span>
                    {item.name}
                  </span>

                  <strong>
                    {formatNumber(
                      item.value,
                    )}
                  </strong>
                </div>
              ),
            )}
          </div>
        </article>
      </div>


      <div className="executive-status-grid">
        <article className="executive-status-card warning">
          <div className="executive-status-icon">
            <AlertTriangle
              size={16}
            />
          </div>

          <div>
            <span>
              Alertas de inventario
            </span>

            <strong>
              {alertProducts.length >
              0
                ? `${alertProducts.length} productos requieren atención`
                : "Sin alertas críticas"}
            </strong>

            <small>
              {alertProducts.length >
              0
                ? alertProducts
                    .map(
                      (
                        product,
                      ) =>
                        product.name,
                    )
                    .join(
                      " · ",
                    )
                : "El inventario se encuentra dentro de los niveles registrados."}
            </small>
          </div>
        </article>


        <article className="executive-status-card">
          <div className="executive-status-icon cyan">
            <Activity
              size={16}
            />
          </div>

          <div>
            <span>
              Resumen comercial
            </span>

            <strong>
              {formatNumber(
                salesCount,
              )} ventas registradas
            </strong>

            <small>
              Ingresos acumulados:{" "}
              {formatCurrency(
                revenue,
              )}
            </small>
          </div>
        </article>


        <article className="executive-status-card">
          <div className="executive-status-icon green">
            <Boxes
              size={16}
            />
          </div>

          <div>
            <span>
              Estado del catálogo
            </span>

            <strong>
              {formatNumber(
                productCount,
              )} productos
            </strong>

            <small>
              Salud de inventario:{" "}
              {formatPercent(
                stockHealth,
              )}
            </small>
          </div>
        </article>
      </div>
    </section>
  );
}


export default DashboardPage;
