import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CalendarDays,
  Boxes,
  Package,
  ReceiptText,
  ShoppingBag,
  TrendingUp,
  UsersRound,
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

import StatCard from "../../components/ui/StatCard";


const salesData = [
  { day: "Lun", sales: 8200 },
  { day: "Mar", sales: 9800 },
  { day: "Mié", sales: 8600 },
  { day: "Jue", sales: 12300 },
  { day: "Vie", sales: 11200 },
  { day: "Sáb", sales: 14700 },
  { day: "Dom", sales: 13200 },
];


const categoryData = [
  { name: "Tecnología", value: 78 },
  { name: "Oficina", value: 62 },
  { name: "Hogar", value: 49 },
  { name: "Accesorios", value: 36 },
];


const recentSales = [
  {
    id: "VT-1048",
    customer: "Comercial Rivera",
    date: "29 Sep, 08:35",
    amount: "S/ 2,480.00",
    status: "Completada",
  },
  {
    id: "VT-1047",
    customer: "Grupo San Martín",
    date: "29 Sep, 08:12",
    amount: "S/ 1,320.00",
    status: "Completada",
  },
  {
    id: "VT-1046",
    customer: "Distribuidora Norte",
    date: "29 Sep, 07:54",
    amount: "S/ 870.00",
    status: "Pendiente",
  },
  {
    id: "VT-1045",
    customer: "Inversiones Lima",
    date: "28 Sep, 18:28",
    amount: "S/ 3,640.00",
    status: "Completada",
  },
];


const stockAlerts = [
  {
    product: "Mouse inalámbrico",
    stock: "4 unidades",
    level: "Crítico",
  },
  {
    product: "Teclado mecánico",
    stock: "7 unidades",
    level: "Bajo",
  },
  {
    product: "Monitor 24 pulgadas",
    stock: "8 unidades",
    level: "Bajo",
  },
];


function DashboardPage() {
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
            Resumen general de la actividad comercial,
            ingresos, clientes e inventario de SalesIA Enterprise.
          </p>
        </div>

        <button
          type="button"
          className="date-filter-button"
        >
          <CalendarDays size={17} />
          Últimos 7 días
        </button>
      </div>

      <div className="dashboard-highlight">
        <div>
          <span>
            RESUMEN COMERCIAL
          </span>

          <h2>
            La operación comercial mantiene una evolución
            positiva durante el periodo actual.
          </h2>

          <p>
            Consulta los principales indicadores empresariales
            y detecta rápidamente situaciones que requieren
            atención.
          </p>
        </div>

        <div className="highlight-metric">
          <TrendingUp size={21} />

          <div>
            <strong>
              +12.4%
            </strong>

            <span>
              crecimiento semanal
            </span>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Ventas registradas"
          value="248"
          change="8.2%"
          caption="vs. periodo anterior"
          icon={ShoppingBag}
        />

        <StatCard
          title="Ingresos"
          value="S/ 84,560"
          change="12.4%"
          caption="vs. periodo anterior"
          icon={Banknote}
        />

        <StatCard
          title="Clientes activos"
          value="186"
          change="5.7%"
          caption="14 clientes nuevos"
          icon={UsersRound}
        />

        <StatCard
          title="Ticket promedio"
          value="S/ 341"
          change="2.1%"
          caption="promedio por venta"
          icon={ReceiptText}
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
                Total semanal
              </span>

              <strong>
                S/ 78,000
              </strong>
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <AreaChart data={salesData}>
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
                  width={45}
                />

                <Tooltip
                  formatter={(value) => [
                    `S/ ${Number(value).toLocaleString(
                      "es-PE",
                    )}`,
                    "Ingresos",
                  ]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    boxShadow:
                      "0 10px 30px rgba(15,23,42,0.08)",
                    fontSize: "11px",
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#2563EB"
                  strokeWidth={3}
                  fill="url(#salesGradient)"
                  activeDot={{
                    r: 5,
                    fill: "#06B6D4",
                    stroke: "#FFFFFF",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="panel-label">
                CATEGORÍAS
              </span>

              <h3>
                Rendimiento comercial
              </h3>
            </div>

            <button
              type="button"
              className="text-action"
            >
              Ver detalle
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="bar-chart-container">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={categoryData}
                layout="vertical"
                margin={{
                  left: 12,
                  right: 10,
                }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  horizontal={false}
                  stroke="#EEF2F7"
                />

                <XAxis
                  type="number"
                  hide
                  domain={[0, 100]}
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  width={85}
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#64748B",
                    fontSize: 10,
                  }}
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    fontSize: "11px",
                  }}
                />

                <Bar
                  dataKey="value"
                  fill="#06B6D4"
                  radius={[0, 6, 6, 0]}
                  barSize={12}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      <div className="dashboard-secondary-grid">
        <article className="panel recent-sales-panel">
          <div className="panel-header">
            <div>
              <span className="panel-label">
                ACTIVIDAD COMERCIAL
              </span>

              <h3>
                Ventas recientes
              </h3>
            </div>

            <button
              type="button"
              className="text-action"
            >
              Ver todas
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="table-wrapper">
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Venta</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>

              <tbody>
                {recentSales.map(
                  (sale) => (
                    <tr key={sale.id}>
                      <td>
                        <strong>
                          {sale.id}
                        </strong>
                      </td>

                      <td>
                        {sale.customer}
                      </td>

                      <td>
                        {sale.date}
                      </td>

                      <td>
                        <strong>
                          {sale.amount}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${
                            sale.status ===
                            "Completada"
                              ? "success"
                              : "pending"
                          }`}
                        >
                          {sale.status}
                        </span>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel stock-panel">
          <div className="panel-header">
            <div>
              <span className="panel-label">
                INVENTARIO
              </span>

              <h3>
                Alertas de stock
              </h3>
            </div>

            <div className="alert-count">
              <AlertTriangle size={15} />
              {stockAlerts.length}
            </div>
          </div>

          <div className="stock-list">
            {stockAlerts.map(
              (item) => (
                <div
                  className="stock-item"
                  key={item.product}
                >
                  <div className="stock-icon">
                    <Package size={18} />
                  </div>

                  <div className="stock-info">
                    <strong>
                      {item.product}
                    </strong>

                    <span>
                      {item.stock}
                    </span>
                  </div>

                  <span
                    className={`stock-level ${
                      item.level ===
                      "Crítico"
                        ? "critical"
                        : ""
                    }`}
                  >
                    {item.level}
                  </span>
                </div>
              ),
            )}
          </div>

          <button
            type="button"
            className="inventory-button"
          >
            <Boxes size={16} />
            Revisar inventario
          </button>
        </article>
      </div>
    </section>
  );
}


export default DashboardPage;
