import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Boxes,
  CalendarDays,
  Package,
  PackageSearch,
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

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import StatCard from "../../components/ui/StatCard";

import {
  apiFetch,
} from "../../services/api";

import {
  useAuth,
} from "../../services/auth.context";


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

  scope?: string;
}


function numberValue(
  value: unknown,
): number {
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


function formatChartDay(
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


function formatSaleStatus(
  status?: string,
) {
  const normalized =
    String(
      status ?? "",
    )
      .trim()
      .toLowerCase();

  const labels:
    Record<string, string> = {
      completed: "Completada",
      pending: "Pendiente",
      cancelled: "Anulada",
      canceled: "Anulada",
      registered: "Registrada",
    };

  return (
    labels[normalized]
    ?? status
    ?? "Registrada"
  );
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
        {[1, 2, 3, 4].map(
          (item) => (
            <div
              key={item}
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
          <AlertTriangle size={24} />
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
          onClick={onRetry}
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
        <Package size={30} />

        <h2>
          Sin información disponible
        </h2>

        <p>
          El servidor no devolvió información
          para mostrar en el dashboard.
        </p>
      </div>
    </section>
  );
}


function DashboardPage() {
  const navigate =
    useNavigate();

  const {
    user,
  } = useAuth();

  const [
    summary,
    setSummary,
  ] =
    useState<DashboardSummary | null>(
      null,
    );

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


  const loadDashboard =
    useCallback(
      async () => {
        setLoading(true);
        setError("");

        try {
          const data =
            await apiFetch<DashboardSummary>(
              "/dashboard/summary",
            );

          setSummary(
            data || {},
          );
        } catch (err) {
          setSummary(null);

          setError(
            err instanceof Error
              ? err.message
              : "No fue posible obtener la información del dashboard.",
          );
        } finally {
          setLoading(false);
        }
      },
      [],
    );


  useEffect(
    () => {
      loadDashboard();
    },
    [
      loadDashboard,
    ],
  );


  if (loading) {
    return (
      <DashboardLoading />
    );
  }


  if (error) {
    return (
      <DashboardError
        message={error}
        onRetry={
          loadDashboard
        }
      />
    );
  }


  if (!summary) {
    return (
      <DashboardEmpty />
    );
  }


  const role =
    user?.role ?? "";

  const canViewSales =
    [
      "Administrador",
      "Gerente",
      "Vendedor",
    ].includes(role);

  const canViewInventory =
    [
      "Administrador",
      "Gerente",
      "Almacén",
    ].includes(role);


  const salesCount =
    numberValue(
      summary.sales_count,
    );

  const revenue =
    numberValue(
      summary.revenue,
    );

  const activeCustomers =
    numberValue(
      summary.active_customers,
    );

  const averageTicket =
    numberValue(
      summary.average_ticket,
    );

  const productsCount =
    numberValue(
      summary.products_count,
    );

  const lowStockCount =
    numberValue(
      summary.low_stock_count,
    );

  const growth =
    numberValue(
      summary.growth_percentage,
    );

  const isInventoryScope =
    summary.scope ===
    "inventory";


  const salesByDay =
    Array.isArray(
      summary.sales_by_day,
    )
      ? summary.sales_by_day
      : [];

  const recentSales =
    Array.isArray(
      summary.recent_sales,
    )
      ? summary.recent_sales
      : [];

  const stockAlerts =
    Array.isArray(
      summary.stock_alerts,
    )
      ? summary.stock_alerts
      : [];


  const chartData =
    salesByDay.map(
      (
        item,
        index,
      ) => ({
        day: item.day
          ? formatChartDay(
              item.day,
            )
          : `Día ${
              index + 1
            }`,

        revenue:
          numberValue(
            item.revenue,
          ),
      }),
    );


  const scopeDescription =
    summary.scope === "user"
      ? "Los indicadores comerciales corresponden a tus ventas de los últimos 30 días."
      : isInventoryScope
        ? "La información mostrada corresponde al inventario disponible para tu rol."
        : "Los indicadores corresponden a la actividad de la empresa durante los últimos 30 días.";


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
            Información principal para conocer
            rápidamente el estado actual de
            SalesIA Enterprise.
          </p>
        </div>

        <div className="dashboard-period">
          <CalendarDays size={17} />

          <span>
            Últimos 30 días
          </span>
        </div>
      </div>


      <div className="dashboard-highlight">
        <div>
          <span>
            {isInventoryScope
              ? "RESUMEN DE INVENTARIO"
              : "RESUMEN COMERCIAL"}
          </span>

          <h2>
            {isInventoryScope
              ? "Estado actual del inventario."
              : "Actividad comercial del periodo actual."}
          </h2>

          <p>
            {scopeDescription}
          </p>
        </div>


        {isInventoryScope ? (
          <div className="highlight-metric">
            <AlertTriangle size={21} />

            <div>
              <strong>
                {formatNumber(
                  lowStockCount,
                )}
              </strong>

              <span>
                productos con stock bajo
                o agotado
              </span>
            </div>
          </div>
        ) : (
          <div className="highlight-metric">
            <TrendingUp size={21} />

            <div>
              <strong>
                {growth >= 0
                  ? "+"
                  : ""}
                {growth.toFixed(1)}%
              </strong>

              <span>
                ingresos vs. 30 días
                anteriores
              </span>
            </div>
          </div>
        )}
      </div>


      {isInventoryScope ? (
        <div className="stats-grid inventory-stats">
          <StatCard
            title="Productos activos"
            value={
              formatNumber(
                productsCount,
              )
            }
            caption="productos controlados"
            icon={PackageSearch}
          />

          <StatCard
            title="Alertas de stock"
            value={
              formatNumber(
                lowStockCount,
              )
            }
            caption="requieren atención"
            icon={Boxes}
          />
        </div>
      ) : (
        <div className="stats-grid">
          <StatCard
            title="Ventas registradas"
            value={
              formatNumber(
                salesCount,
              )
            }
            caption="últimos 30 días"
            icon={ShoppingBag}
          />

          <StatCard
            title="Ingresos"
            value={
              formatCurrency(
                revenue,
              )
            }
            change={`${Math.abs(
              growth,
            ).toFixed(1)}%`}
            positive={
              growth >= 0
            }
            caption="vs. 30 días anteriores"
            icon={Banknote}
          />

          <StatCard
            title="Clientes activos"
            value={
              formatNumber(
                activeCustomers,
              )
            }
            caption="clientes activos"
            icon={UsersRound}
          />

          <StatCard
            title="Ticket promedio"
            value={
              formatCurrency(
                averageTicket,
              )
            }
            caption="promedio por venta"
            icon={ReceiptText}
          />
        </div>
      )}


      <div className="dashboard-main-grid">
        {!isInventoryScope ? (
          <>
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
                    Total últimos 30 días
                  </span>

                  <strong>
                    {formatCurrency(
                      revenue,
                    )}
                  </strong>
                </div>
              </div>

              <div className="chart-container">
                {chartData.length > 0 ? (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <AreaChart
                      data={chartData}
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
                            stopOpacity={0.24}
                          />

                          <stop
                            offset="100%"
                            stopColor="#2563EB"
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        strokeDasharray="4 4"
                        vertical={false}
                        stroke="#E9EEF5"
                      />

                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "#64748B",
                          fontSize: 11,
                        }}
                      />

                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "#64748B",
                          fontSize: 11,
                        }}
                      />

                      <Tooltip
                        formatter={
                          (value) =>
                            formatCurrency(
                              value,
                            )
                        }
                      />

                      <Area
                        type="monotone"
                        dataKey="revenue"
                        name="Ingresos"
                        stroke="#2563EB"
                        strokeWidth={2.5}
                        fill="url(#salesGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="dashboard-chart-empty">
                    <Package size={24} />

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

                {canViewSales ? (
                  <button
                    type="button"
                    className="text-action"
                    onClick={() =>
                      navigate(
                        "/sales",
                      )
                    }
                  >
                    Ver ventas

                    <ArrowRight
                      size={15}
                    />
                  </button>
                ) : null}
              </div>


              <div className="dashboard-list">
                {recentSales.length ===
                0 ? (
                  <div className="dashboard-list-empty">
                    No hay ventas recientes
                    en este periodo.
                  </div>
                ) : (
                  recentSales.map(
                    (
                      sale,
                      index,
                    ) => {
                      const saleId =
                        sale.sale_number
                        || sale.id
                        || `Venta-${
                          index + 1
                        }`;

                      const customer =
                        sale.customer_name
                        || "Cliente no especificado";

                      const date =
                        sale.sale_date
                          ? new Date(
                              sale.sale_date,
                            )
                              .toLocaleDateString(
                                "es-PE",
                              )
                          : "Fecha no disponible";

                      return (
                        <div
                          className="dashboard-list-item"
                          key={
                            sale.id
                            || saleId
                          }
                        >
                          <div>
                            <strong>
                              {saleId}
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
                                sale.total,
                              )}
                            </strong>

                            <span>
                              {formatSaleStatus(
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
          </>
        ) : null}


        <article
          className={`panel ${
            isInventoryScope
              ? "dashboard-inventory-panel"
              : ""
          }`}
        >
          <div className="panel-header">
            <div>
              <span className="panel-label">
                INVENTARIO
              </span>

              <h3>
                Alertas de stock
              </h3>
            </div>

            {canViewInventory ? (
              <button
                type="button"
                className="text-action"
                onClick={() =>
                  navigate(
                    "/inventory",
                  )
                }
              >
                Ver inventario

                <ArrowRight
                  size={15}
                />
              </button>
            ) : (
              <AlertTriangle
                size={18}
              />
            )}
          </div>


          <div className="dashboard-list">
            {stockAlerts.length ===
            0 ? (
              <div className="dashboard-list-empty">
                No existen productos
                en nivel mínimo o agotados.
              </div>
            ) : (
              stockAlerts.map(
                (
                  alert,
                  index,
                ) => {
                  const product =
                    alert.product_name
                    || `Producto ${
                      index + 1
                    }`;

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
                      key={`${product}-${index}`}
                    >
                      <div>
                        <strong>
                          {product}
                        </strong>

                        <span>
                          Stock actual:{" "}
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
    </section>
  );
}


export default DashboardPage;
