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

import { useCallback, useEffect, useState } from "react";

import StatCard from "../../components/ui/StatCard";
import { apiFetch } from "../../services/api";

interface DashboardSummary {
  sales_count?: number | null;
  revenue?: number | null;
  active_customers?: number | null;
  average_ticket?: number | null;
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
function numberValue(value: unknown): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: unknown) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(numberValue(value));
}

function formatNumber(value: unknown) {
  return new Intl.NumberFormat("es-PE").format(numberValue(value));
}

function DashboardLoading() {
  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">CENTRO DE CONTROL</span>

          <h1>Dashboard ejecutivo</h1>

          <p>Cargando información empresarial...</p>
        </div>
      </div>

      <div className="stats-grid">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="dashboard-skeleton-card" />
        ))}
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

        <h2>No fue posible cargar el dashboard</h2>

        <p>{message}</p>

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

        <h2>Sin información disponible</h2>

        <p>El backend no devolvió información para mostrar en el dashboard.</p>
      </div>
    </section>
  );
}

function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch<DashboardSummary>("/dashboard/summary");

      console.log("SalesIA Dashboard API:", data);

      setSummary(data || {});
    } catch (err) {
      console.error("Error Dashboard:", err);

      setSummary(null);

      setError(
        err instanceof Error
          ? err.message
          : "No fue posible obtener la información del dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return <DashboardLoading />;
  }

  if (error) {
    return <DashboardError message={error} onRetry={loadDashboard} />;
  }

  if (!summary) {
    return <DashboardEmpty />;
  }

  const salesCount = numberValue(summary.sales_count);

  const revenue = numberValue(summary.revenue);

  const activeCustomers = numberValue(summary.active_customers);

  const averageTicket = numberValue(summary.average_ticket);

  const growth = numberValue(summary.growth_percentage);

  const salesByDay = Array.isArray(summary.sales_by_day)
    ? summary.sales_by_day
    : [];

  const recentSales = Array.isArray(summary.recent_sales)
    ? summary.recent_sales
    : [];

  const stockAlerts = Array.isArray(summary.stock_alerts)
    ? summary.stock_alerts
    : [];

  const chartData = salesByDay.map((item, index) => ({
    day: item.day || `Día ${index + 1}`,
    revenue: numberValue(item.revenue),
  }));

  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">CENTRO DE CONTROL</span>

          <h1>Dashboard ejecutivo</h1>

          <p>
            Resumen general de la actividad comercial, ingresos, clientes e
            inventario de SalesIA Enterprise.
          </p>
        </div>

        <button type="button" className="date-filter-button">
          <CalendarDays size={17} />
          Últimos 30 días
        </button>
      </div>

      <div className="dashboard-highlight">
        <div>
          <span>RESUMEN COMERCIAL</span>

          <h2>Resumen actualizado desde el backend empresarial.</h2>

          <p>
            Los indicadores mostrados corresponden a la información disponible
            en SalesIA Enterprise.
          </p>
        </div>

        <div className="highlight-metric">
          <TrendingUp size={21} />

          <div>
            <strong>
              {growth >= 0 ? "+" : ""}
              {growth.toFixed(1)}%
            </strong>

            <span>crecimiento semanal</span>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Ventas registradas"
          value={formatNumber(salesCount)}
          change={`${growth.toFixed(1)}%`}
          caption="vs. periodo anterior"
          icon={ShoppingBag}
        />

        <StatCard
          title="Ingresos"
          value={formatCurrency(revenue)}
          change={`${growth.toFixed(1)}%`}
          caption="periodo actual"
          icon={Banknote}
        />

        <StatCard
          title="Clientes activos"
          value={formatNumber(activeCustomers)}
          change="—"
          caption="clientes registrados"
          icon={UsersRound}
        />

        <StatCard
          title="Ticket promedio"
          value={formatCurrency(averageTicket)}
          change="—"
          caption="promedio por venta"
          icon={ReceiptText}
        />
      </div>

      <div className="dashboard-main-grid">
        <article className="panel panel-large">
          <div className="panel-header">
            <div>
              <span className="panel-label">RENDIMIENTO</span>

              <h3>Ingresos por día</h3>
            </div>

            <div className="panel-total">
              <span>Total Mensual</span>

              <strong>{formatCurrency(revenue)}</strong>
            </div>
          </div>

          <div className="chart-container">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
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
                  <Tooltip formatter={(value) => formatCurrency(value)} />

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

                <span>No hay datos diarios disponibles.</span>
              </div>
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="panel-label">OPERACIÓN</span>

              <h3>Ventas recientes</h3>
            </div>

            <ArrowRight size={18} />
          </div>

          <div className="dashboard-list">
            {recentSales.length === 0 ? (
              <div className="dashboard-list-empty">
                No hay ventas recientes.
              </div>
            ) : (
              recentSales.map((sale, index) => {
                const saleId =
                  sale.id || sale.sale_number || `Venta-${index + 1}`;

                const customer =
                  sale.customer_name || "Cliente no especificado";
                const date = sale.sale_date
                  ? new Date(sale.sale_date).toLocaleDateString("es-PE")
                  : "Fecha no disponible";
                const amount = sale.total ?? 0;

                return (
                  <div className="dashboard-list-item" key={saleId}>
                    <div>
                      <strong>{saleId}</strong>

                      <span>{customer}</span>

                      <small>{date}</small>
                    </div>

                    <div className="dashboard-list-value">
                      <strong>{formatCurrency(amount)}</strong>

                      <span>{sale.status || "Registrada"}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="panel-label">INVENTARIO</span>

              <h3>Alertas de stock</h3>
            </div>

            <AlertTriangle size={18} />
          </div>

          <div className="dashboard-list">
            {stockAlerts.length === 0 ? (
              <div className="dashboard-list-empty">
                No hay alertas de inventario.
              </div>
            ) : (
              stockAlerts.map((alert, index) => {
                const product = alert.product_name || `Producto ${index + 1}`;
                const stock = alert.stock_quantity ?? 0;
                const level = alert.stock_status || "Stock bajo";
                return (
                  <div
                    className="dashboard-list-item"
                    key={`${product}-${index}`}
                  >
                    {" "}
                    <div>
                      {" "}
                      <strong>{product}</strong>{" "}
                      <span>Stock: {formatNumber(stock)}</span>{" "}
                    </div>{" "}
                    <div className="dashboard-alert-level">
                      {" "}
                      <span>{level}</span>{" "}
                    </div>{" "}
                  </div>
                );
              })
            )}
          </div>
        </article>
      </div>
    </section>
  );
}

export default DashboardPage;
