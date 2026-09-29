import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CalendarDays,
  CircleDollarSign,
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
          <span className="page-eyebrow">CENTRO DE CONTROL</span>
          <h1>Dashboard ejecutivo</h1>
          <p>
            Información general de ventas, rendimiento e inventario
            de SalesIA Enterprise.
          </p>
        </div>

        <button className="date-filter-button">
          <CalendarDays size={18} />
          Últimos 7 días
        </button>
      </div>

      <div className="dashboard-highlight">
        <div>
          <span>Resumen comercial</span>

          <h2>
            Tu operación mantiene un crecimiento estable esta semana.
          </h2>

          <p>
            Revisa ventas, ingresos, clientes y alertas operativas
            desde un único punto.
          </p>
        </div>

        <div className="highlight-metric">
          <TrendingUp size={22} />
          <div>
            <strong>+12.4%</strong>
            <span>crecimiento semanal</span>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Ventas"
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
              <span className="panel-label">RENDIMIENTO</span>
              <h3>Ingresos por día</h3>
            </div>

            <div className="panel-total">
              <span>Total semanal</span>
              <strong>S/ 78,000</strong>
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
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
                      stopColor="#2563eb"
                      stopOpacity={0.28}
                    />
                    <stop
                      offset="100%"
                      stopColor="#2563eb"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="#e9eef5"
                />

                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#7a8799", fontSize: 12 }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#7a8799", fontSize: 12 }}
                  width={45}
                />

                <Tooltip
                  formatter={(value) => [
                    `S/ ${Number(value).toLocaleString("es-PE")}`,
                    "Ingresos",
                  ]}
                />

                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fill="url(#salesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="panel-label">CATEGORÍAS</span>
              <h3>Rendimiento comercial</h3>
            </div>

            <button className="text-action">
              Ver detalle
              <ArrowRight size={15} />
            </button>
          </div>

          <div className="bar-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData}
                layout="vertical"
                margin={{ left: 12, right: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  horizontal={false}
                  stroke="#eef2f7"
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
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />

                <Tooltip />

                <Bar
                  dataKey="value"
                  fill="#06b6d4"
                  radius={[0, 8, 8, 0]}
                  barSize={13}
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
              <span className="panel-label">ACTIVIDAD</span>
              <h3>Ventas recientes</h3>
            </div>

            <button className="text-action">
              Ver todas
              <ArrowRight size={15} />
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
                {recentSales.map((sale) => (
                  <tr key={sale.id}>
                    <td>
                      <strong>{sale.id}</strong>
                    </td>

                    <td>{sale.customer}</td>
                    <td>{sale.date}</td>

                    <td>
                      <strong>{sale.amount}</strong>
                    </td>

                    <td>
                      <span
                        className={`status-badge ${
                          sale.status === "Completada"
                            ? "success"
                            : "pending"
                        }`}
                      >
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel stock-panel">
          <div className="panel-header">
            <div>
              <span className="panel-label">INVENTARIO</span>
              <h3>Alertas de stock</h3>
            </div>

            <div className="alert-count">
              <AlertTriangle size={16} />
              3
            </div>
          </div>

          <div className="stock-list">
            {stockAlerts.map((item) => (
              <div className="stock-item" key={item.product}>
                <div className="stock-icon">
                  <Package size={19} />
                </div>

                <div className="stock-info">
                  <strong>{item.product}</strong>
                  <span>{item.stock}</span>
                </div>

                <span
                  className={`stock-level ${
                    item.level === "Crítico" ? "critical" : ""
                  }`}
                >
                  {item.level}
                </span>
              </div>
            ))}
          </div>

          <button className="inventory-button">
            <CircleDollarSign size={17} />
            Revisar inventario
          </button>
        </article>
      </div>
    </section>
  );
}

export default DashboardPage;
