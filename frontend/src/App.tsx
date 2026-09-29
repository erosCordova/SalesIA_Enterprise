<<<<<<< HEAD
import { Navigate, Route, Routes } from 'react-router-dom'

import LoginPage from './modules/auth/LoginPage'
import MainLayout from './layouts/MainLayout'
import DashboardPage from './modules/dashboard/DashboardPage'
=======
import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Boxes,
  Building2,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Database,
  FileBarChart,
  Filter,
  History,
  LayoutDashboard,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Percent,
  Plus,
  Search,
  Settings,
  ShoppingCart,
  TrendingUp,
  Truck,
  UserCheck,
  Users,
  Warehouse,
  X,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Role =
  | "Administrador"
  | "Gerente"
  | "Vendedor"
  | "Analista"
  | "Almacén";

type PageKey =
  | "dashboard"
  | "usuarios"
  | "ventas"
  | "inventario"
  | "actividad"
  | "analytics"
  | "alertas"
  | "ingresos"
  | "clientes"
  | "productos"
  | "kpis"
  | "insights"
  | "mis-ventas"
  | "ventas-dia"
  | "pedidos"
  | "clientes-atendidos"
  | "datasets"
  | "analisis"
  | "media"
  | "mediana"
  | "probabilidades"
  | "stock"
  | "bajo-minimo"
  | "entradas"
  | "salidas"
  | "movimientos";

interface MenuItem {
  id: PageKey;
  label: string;
  icon: React.ElementType;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const salesData = [
  { name: "Lun", ventas: 4200, ingresos: 3800 },
  { name: "Mar", ventas: 5100, ingresos: 4700 },
  { name: "Mié", ventas: 3900, ingresos: 3500 },
  { name: "Jue", ventas: 6200, ingresos: 5700 },
  { name: "Vie", ventas: 7400, ingresos: 6900 },
  { name: "Sáb", ventas: 6800, ingresos: 6200 },
  { name: "Dom", ventas: 4300, ingresos: 4000 },
];

const categoryData = [
  { name: "Electrónica", value: 42 },
  { name: "Computación", value: 28 },
  { name: "Accesorios", value: 18 },
  { name: "Oficina", value: 12 },
];

const productsData = [
  { producto: "Laptop Pro 15", ventas: 124, ingresos: 148800 },
  { producto: "Monitor 24\"", ventas: 98, ingresos: 44100 },
  { producto: "Teclado Mecánico", ventas: 86, ingresos: 12900 },
  { producto: "Mouse Inalámbrico", ventas: 74, ingresos: 5920 },
  { producto: "PC Empresarial", ventas: 63, ingresos: 75600 },
];

const inventoryData = [
  {
    codigo: "PRD-001",
    producto: "Laptop Pro 15",
    categoria: "Computación",
    stock: 24,
    minimo: 10,
    estado: "Disponible",
  },
  {
    codigo: "PRD-002",
    producto: "Monitor 24\"",
    categoria: "Electrónica",
    stock: 8,
    minimo: 12,
    estado: "Bajo mínimo",
  },
  {
    codigo: "PRD-003",
    producto: "Teclado Mecánico",
    categoria: "Accesorios",
    stock: 35,
    minimo: 15,
    estado: "Disponible",
  },
  {
    codigo: "PRD-004",
    producto: "Mouse Inalámbrico",
    categoria: "Accesorios",
    stock: 6,
    minimo: 10,
    estado: "Bajo mínimo",
  },
  {
    codigo: "PRD-005",
    producto: "PC Empresarial",
    categoria: "Computación",
    stock: 17,
    minimo: 8,
    estado: "Disponible",
  },
];

const recentSales = [
  {
    id: "VNT-0001",
    cliente: "Corporación Andina",
    vendedor: "Carlos Mendoza",
    total: 4250,
    estado: "Completada",
    hora: "09:42",
  },
  {
    id: "VNT-0002",
    cliente: "Grupo Norte SAC",
    vendedor: "María Torres",
    total: 2180,
    estado: "Completada",
    hora: "10:15",
  },
  {
    id: "VNT-0003",
    cliente: "Innova Perú",
    vendedor: "Carlos Mendoza",
    total: 5890,
    estado: "Pendiente",
    hora: "11:08",
  },
  {
    id: "VNT-0004",
    cliente: "Distribuciones Lima",
    vendedor: "Ana Pérez",
    total: 3240,
    estado: "Completada",
    hora: "11:54",
  },
];

const activityData = [
  {
    action: "Venta registrada",
    user: "Carlos Mendoza",
    module: "Ventas",
    time: "Hace 5 min",
    type: "success",
  },
  {
    action: "Producto actualizado",
    user: "Admin",
    module: "Productos",
    time: "Hace 18 min",
    type: "info",
  },
  {
    action: "Stock bajo mínimo",
    user: "Sistema",
    module: "Inventario",
    time: "Hace 32 min",
    type: "warning",
  },
  {
    action: "Análisis ejecutado",
    user: "Laura Sánchez",
    module: "Analytics",
    time: "Hace 45 min",
    type: "analytics",
  },
];

const roleMenus: Record<Role, MenuSection[]> = {
  Administrador: [
    {
      title: "GENERAL",
      items: [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "GESTIÓN",
      items: [
        { id: "usuarios", label: "Usuarios", icon: Users },
        { id: "ventas", label: "Ventas", icon: ShoppingCart },
        { id: "inventario", label: "Inventario", icon: Warehouse },
      ],
    },
    {
      title: "MONITOREO",
      items: [
        { id: "actividad", label: "Actividad del sistema", icon: Activity },
        { id: "analytics", label: "Analytics", icon: BarChart3 },
        { id: "alertas", label: "Alertas", icon: Bell },
      ],
    },
  ],

  Gerente: [
    {
      title: "GENERAL",
      items: [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "COMERCIAL",
      items: [
        { id: "ventas", label: "Ventas", icon: ShoppingCart },
        { id: "ingresos", label: "Ingresos", icon: TrendingUp },
        { id: "clientes", label: "Clientes activos", icon: UserCheck },
        { id: "productos", label: "Productos", icon: Package },
      ],
    },
    {
      title: "OPERACIONES",
      items: [
        { id: "inventario", label: "Inventario", icon: Warehouse },
      ],
    },
    {
      title: "ANÁLISIS",
      items: [
        { id: "kpis", label: "KPIs", icon: BarChart3 },
        { id: "analytics", label: "Analytics", icon: Calculator },
        { id: "insights", label: "Insights", icon: Zap },
      ],
    },
  ],

  Vendedor: [
    {
      title: "GENERAL",
      items: [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "VENTAS",
      items: [
        { id: "mis-ventas", label: "Mis ventas", icon: ShoppingCart },
        { id: "ventas-dia", label: "Ventas del día", icon: TrendingUp },
        { id: "pedidos", label: "Pedidos pendientes", icon: ClipboardList },
      ],
    },
    {
      title: "CLIENTES",
      items: [
        {
          id: "clientes-atendidos",
          label: "Clientes atendidos",
          icon: UserCheck,
        },
      ],
    },
  ],

  Analista: [
    {
      title: "GENERAL",
      items: [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "ANÁLISIS",
      items: [
        { id: "datasets", label: "Datasets", icon: Database },
        { id: "analisis", label: "Análisis ejecutados", icon: FileBarChart },
        { id: "media", label: "Media", icon: Calculator },
        { id: "mediana", label: "Mediana", icon: Calculator },
        { id: "probabilidades", label: "Probabilidades", icon: Percent },
        { id: "insights", label: "Insights", icon: Zap },
      ],
    },
  ],

  "Almacén": [
    {
      title: "GENERAL",
      items: [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "INVENTARIO",
      items: [
        { id: "stock", label: "Stock", icon: Boxes },
        {
          id: "bajo-minimo",
          label: "Productos bajo mínimo",
          icon: AlertTriangle,
        },
        { id: "entradas", label: "Entradas", icon: ArrowDownRight },
        { id: "salidas", label: "Salidas", icon: ArrowUpRight },
        { id: "movimientos", label: "Movimientos", icon: History },
      ],
    },
  ],
};

const pageTitles: Record<PageKey, string> = {
  dashboard: "Dashboard",
  usuarios: "Usuarios",
  ventas: "Ventas",
  inventario: "Inventario",
  actividad: "Actividad del sistema",
  analytics: "Analytics",
  alertas: "Alertas",
  ingresos: "Ingresos",
  clientes: "Clientes activos",
  productos: "Productos",
  kpis: "KPIs",
  insights: "Insights",
  "mis-ventas": "Mis ventas",
  "ventas-dia": "Ventas del día",
  pedidos: "Pedidos pendientes",
  "clientes-atendidos": "Clientes atendidos",
  datasets: "Datasets",
  analisis: "Análisis ejecutados",
  media: "Media aritmética",
  mediana: "Mediana",
  probabilidades: "Probabilidades",
  stock: "Stock",
  "bajo-minimo": "Productos bajo mínimo",
  entradas: "Entradas",
  salidas: "Salidas",
  movimientos: "Movimientos",
};
>>>>>>> 491a911a0b1ea449b899958c0dfccf356d86f6ff

function App() {
  const [role, setRole] = useState<Role>("Administrador");
  const [page, setPage] = useState<PageKey>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const currentSections = roleMenus[role];

  const activePage = useMemo(() => {
    const allItems = currentSections.flatMap((section) => section.items);
    return allItems.some((item) => item.id === page) ? page : "dashboard";
  }, [currentSections, page]);

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    setPage("dashboard");
    setProfileOpen(false);
  };

  return (
<<<<<<< HEAD
    <Routes>
      {/* LOGIN */}
      <Route path="/" element={<LoginPage />} />

      
      <Route element={<MainLayout />}>
        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />
      </Route>

      {/* Cualquier ruta desconocida vuelve al login */}
      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  )
}

export default App
=======
    <div className="app-shell">
      <Sidebar
        role={role}
        sections={currentSections}
        activePage={activePage}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((value) => !value)}
        onNavigate={setPage}
      />

      <div className={`main-area ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
        <Topbar
          role={role}
          title={pageTitles[activePage]}
          notificationsOpen={notificationsOpen}
          profileOpen={profileOpen}
          onNotifications={() => {
            setNotificationsOpen((value) => !value);
            setProfileOpen(false);
          }}
          onProfile={() => {
            setProfileOpen((value) => !value);
            setNotificationsOpen(false);
          }}
          onRoleChange={handleRoleChange}
          onCloseMenus={() => {
            setNotificationsOpen(false);
            setProfileOpen(false);
          }}
        />

        <main className="content">
          {activePage === "dashboard" && <Dashboard role={role} />}

          {activePage === "usuarios" && <UsersPage />}
          {activePage === "ventas" && <SalesPage />}
          {activePage === "inventario" && <InventoryPage />}
          {activePage === "actividad" && <ActivityPage />}
          {activePage === "analytics" && <AnalyticsPage />}
          {activePage === "alertas" && <AlertsPage />}

          {activePage === "ingresos" && <IncomePage />}
          {activePage === "clientes" && <ActiveCustomersPage />}
          {activePage === "productos" && <ProductsPage />}
          {activePage === "kpis" && <KpisPage />}
          {activePage === "insights" && <InsightsPage />}

          {activePage === "mis-ventas" && <MySalesPage />}
          {activePage === "ventas-dia" && <DailySalesPage />}
          {activePage === "pedidos" && <PendingOrdersPage />}
          {activePage === "clientes-atendidos" && (
            <AttendedCustomersPage />
          )}

          {activePage === "datasets" && <DatasetsPage />}
          {activePage === "analisis" && <AnalysisPage />}
          {activePage === "media" && <MeanPage />}
          {activePage === "mediana" && <MedianPage />}
          {activePage === "probabilidades" && <ProbabilityPage />}

          {activePage === "stock" && <StockPage />}
          {activePage === "bajo-minimo" && <LowStockPage />}
          {activePage === "entradas" && <EntriesPage />}
          {activePage === "salidas" && <OutputsPage />}
          {activePage === "movimientos" && <MovementsPage />}
        </main>
      </div>
    </div>
  );
}

/* ============================================================
   SIDEBAR
============================================================ */

function Sidebar({
  role,
  sections,
  activePage,
  open,
  onToggle,
  onNavigate,
}: {
  role: Role;
  sections: MenuSection[];
  activePage: PageKey;
  open: boolean;
  onToggle: () => void;
  onNavigate: (page: PageKey) => void;
}) {
  return (
    <aside className={`sidebar ${open ? "" : "collapsed"}`}>
      <div className="brand">
        <div className="brand-mark">
          <BarChart3 size={22} strokeWidth={2.5} />
        </div>

        {open && (
          <div className="brand-text">
            <strong>SalesIA</strong>
            <span>ENTERPRISE</span>
          </div>
        )}
      </div>

      <div className="sidebar-role">
        <span className="role-dot" />
        {open && (
          <div>
            <small>Sesión actual</small>
            <strong>{role}</strong>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {sections.map((section) => (
          <div className="menu-section" key={section.title}>
            {open && <div className="menu-section-title">{section.title}</div>}

            {section.items.map((item) => {
              const Icon = item.icon;
              const active = activePage === item.id;

              return (
                <button
                  className={`menu-item ${active ? "active" : ""}`}
                  key={item.id}
                  title={!open ? item.label : undefined}
                  onClick={() => onNavigate(item.id)}
                >
                  <Icon size={19} strokeWidth={2} />
                  {open && <span>{item.label}</span>}
                  {open && active && (
                    <ChevronRight className="menu-arrow" size={15} />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button className="sidebar-collapse" onClick={onToggle}>
          {open ? (
            <>
              <PanelLeftClose size={18} />
              <span>Contraer menú</span>
            </>
          ) : (
            <PanelLeftOpen size={18} />
          )}
        </button>

        {open && (
          <div className="system-status">
            <span className="status-pulse" />
            <div>
              <strong>Sistema operativo</strong>
              <small>SalesIA Enterprise v1.0</small>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ============================================================
   TOPBAR
============================================================ */

function Topbar({
  role,
  title,
  notificationsOpen,
  profileOpen,
  onNotifications,
  onProfile,
  onRoleChange,
  onCloseMenus,
}: {
  role: Role;
  title: string;
  notificationsOpen: boolean;
  profileOpen: boolean;
  onNotifications: () => void;
  onProfile: () => void;
  onRoleChange: (role: Role) => void;
  onCloseMenus: () => void;
}) {
  return (
    <header className="topbar" onClick={onCloseMenus}>
      <div className="breadcrumb">
        <span>SalesIA Enterprise</span>
        <ChevronRight size={15} />
        <strong>{title}</strong>
      </div>

      <div
        className="topbar-actions"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="environment">
          <span className="environment-dot" />
          Sistema activo
        </div>

        <button className="icon-button" onClick={onNotifications}>
          <Bell size={19} />
          <span className="notification-badge">3</span>
        </button>

        {notificationsOpen && (
          <div className="dropdown notification-dropdown">
            <div className="dropdown-header">
              <strong>Notificaciones</strong>
              <span>3 nuevas</span>
            </div>

            <NotificationItem
              icon={<AlertTriangle size={16} />}
              title="Stock bajo mínimo"
              text="2 productos requieren atención."
              type="warning"
            />

            <NotificationItem
              icon={<CheckCircle2 size={16} />}
              title="Venta registrada"
              text="VNT-0004 fue procesada correctamente."
              type="success"
            />

            <NotificationItem
              icon={<BarChart3 size={16} />}
              title="Análisis disponible"
              text="Nuevo resultado estadístico."
              type="analytics"
            />
          </div>
        )}

        <div className="profile-wrapper">
          <button className="profile-button" onClick={onProfile}>
            <div className="avatar">DR</div>
            <div className="profile-info">
              <strong>Dulce Ramos</strong>
              <span>{role}</span>
            </div>
            <ChevronDown size={16} />
          </button>

          {profileOpen && (
            <div className="dropdown profile-dropdown">
              <div className="profile-dropdown-title">
                <span>Modo de demostración</span>
                <strong>Cambiar rol</strong>
              </div>

              {(
                [
                  "Administrador",
                  "Gerente",
                  "Vendedor",
                  "Analista",
                  "Almacén",
                ] as Role[]
              ).map((item) => (
                <button
                  className={`role-option ${role === item ? "selected" : ""}`}
                  key={item}
                  onClick={() => onRoleChange(item)}
                >
                  <div className="mini-avatar">
                    {item.charAt(0).toUpperCase()}
                  </div>
                  <span>{item}</span>
                  {role === item && <CheckCircle2 size={16} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function NotificationItem({
  icon,
  title,
  text,
  type,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  type: string;
}) {
  return (
    <div className="notification-item">
      <div className={`notification-icon ${type}`}>{icon}</div>
      <div>
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
    </div>
  );
}

/* ============================================================
   DASHBOARD
============================================================ */

function Dashboard({ role }: { role: Role }) {
  const dashboardConfig = {
    Administrador: {
      eyebrow: "CENTRO DE CONTROL",
      title: "Resumen administrativo",
      description:
        "Supervisa las operaciones comerciales y el estado general de SalesIA Enterprise.",
    },
    Gerente: {
      eyebrow: "VISIÓN EJECUTIVA",
      title: "Panel ejecutivo",
      description:
        "Consulta el comportamiento comercial, los indicadores y los resultados de Analytics.",
    },
    Vendedor: {
      eyebrow: "OPERACIÓN COMERCIAL",
      title: "Mi jornada comercial",
      description:
        "Consulta tus ventas, pedidos pendientes y clientes atendidos.",
    },
    Analista: {
      eyebrow: "INTELIGENCIA ANALÍTICA",
      title: "Centro de análisis",
      description:
        "Trabaja con datasets y resultados estadísticos generados por SalesIA.",
    },
    "Almacén": {
      eyebrow: "CONTROL DE INVENTARIO",
      title: "Operaciones de almacén",
      description:
        "Supervisa el stock, movimientos y productos que requieren reposición.",
    },
  };

  const config = dashboardConfig[role];

  return (
    <div className="page">
      <div className="hero">
        <div>
          <span className="eyebrow">{config.eyebrow}</span>
          <h1>{config.title}</h1>
          <p>{config.description}</p>
        </div>

        <div className="hero-date">
          <span>Periodo actual</span>
          <strong>Septiembre 2026</strong>
        </div>
      </div>

      <DashboardKpis role={role} />

      <div className="dashboard-grid">
        <section className="panel chart-panel large">
          <PanelHeader
            title="Evolución de ventas"
            subtitle="Comportamiento de las operaciones durante el periodo"
            action="Últimos 7 días"
          />

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopOpacity={0.28} />
                    <stop offset="100%" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} />

                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />

                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="ventas"
                  stroke="#2563EB"
                  fill="url(#salesGradient)"
                  strokeWidth={3}
                />

                <Area
                  type="monotone"
                  dataKey="ingresos"
                  stroke="#06B6D4"
                  fill="transparent"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel">
          <PanelHeader
            title="Distribución comercial"
            subtitle="Participación por categoría"
          />

          <div className="pie-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="48%"
                  innerRadius={62}
                  outerRadius={92}
                  paddingAngle={3}
                >
                  {categoryData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={["#2563EB", "#06B6D4", "#64748B", "#94A3B8"][index]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="legend-list">
            {categoryData.map((item, index) => (
              <div className="legend-item" key={item.name}>
                <span
                  className="legend-dot"
                  style={{
                    background:
                      ["#2563EB", "#06B6D4", "#64748B", "#94A3B8"][index],
                  }}
                />
                <span>{item.name}</span>
                <strong>{item.value}%</strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="dashboard-grid bottom-grid">
        <RecentSales />

        <section className="panel">
          <PanelHeader
            title="Actividad reciente"
            subtitle="Últimas acciones registradas"
            action="Ver actividad"
          />

          <div className="activity-list">
            {activityData.map((activity) => (
              <div className="activity-row" key={activity.action}>
                <div className={`activity-icon ${activity.type}`}>
                  {activity.type === "success" && (
                    <CheckCircle2 size={16} />
                  )}
                  {activity.type === "info" && <Package size={16} />}
                  {activity.type === "warning" && (
                    <AlertTriangle size={16} />
                  )}
                  {activity.type === "analytics" && <BarChart3 size={16} />}
                </div>

                <div className="activity-content">
                  <strong>{activity.action}</strong>
                  <span>
                    {activity.user} · {activity.module}
                  </span>
                </div>

                <small>{activity.time}</small>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function DashboardKpis({ role }: { role: Role }) {
  const common = [
    {
      title: "Ventas del periodo",
      value: "1,248",
      change: "+12.8%",
      positive: true,
      icon: ShoppingCart,
    },
    {
      title: "Ingresos",
      value: "S/ 284,520",
      change: "+8.4%",
      positive: true,
      icon: TrendingUp,
    },
    {
      title: "Clientes activos",
      value: "864",
      change: "+5.2%",
      positive: true,
      icon: Users,
    },
    {
      title: "Alertas",
      value: "07",
      change: "2 críticas",
      positive: false,
      icon: Bell,
    },
  ];

  if (role === "Vendedor") {
    common[0] = {
      title: "Mis ventas",
      value: "86",
      change: "+14.5%",
      positive: true,
      icon: ShoppingCart,
    };

    common[1] = {
      title: "Ventas del día",
      value: "S/ 8,420",
      change: "+7.2%",
      positive: true,
      icon: TrendingUp,
    };

    common[2] = {
      title: "Clientes atendidos",
      value: "32",
      change: "+4",
      positive: true,
      icon: UserCheck,
    };

    common[3] = {
      title: "Pedidos pendientes",
      value: "08",
      change: "3 urgentes",
      positive: false,
      icon: ClipboardList,
    };
  }

  if (role === "Almacén") {
    common[0] = {
      title: "Productos en stock",
      value: "1,842",
      change: "+2.1%",
      positive: true,
      icon: Boxes,
    };

    common[1] = {
      title: "Entradas",
      value: "246",
      change: "+8.7%",
      positive: true,
      icon: ArrowDownRight,
    };

    common[2] = {
      title: "Salidas",
      value: "184",
      change: "+4.8%",
      positive: true,
      icon: ArrowUpRight,
    };

    common[3] = {
      title: "Bajo mínimo",
      value: "12",
      change: "5 críticos",
      positive: false,
      icon: AlertTriangle,
    };
  }

  if (role === "Analista") {
    common[0] = {
      title: "Datasets",
      value: "24",
      change: "+3 nuevos",
      positive: true,
      icon: Database,
    };

    common[1] = {
      title: "Análisis ejecutados",
      value: "138",
      change: "+18.2%",
      positive: true,
      icon: FileBarChart,
    };

    common[2] = {
      title: "Media ticket",
      value: "S/ 228.14",
      change: "+6.4%",
      positive: true,
      icon: Calculator,
    };

    common[3] = {
      title: "Insights",
      value: "17",
      change: "4 nuevos",
      positive: true,
      icon: Zap,
    };
  }

  return (
    <div className="kpi-grid">
      {common.map((item) => {
        const Icon = item.icon;

        return (
          <div className="kpi-card" key={item.title}>
            <div className="kpi-top">
              <div className="kpi-icon">
                <Icon size={20} />
              </div>

              <span
                className={`kpi-change ${
                  item.positive ? "positive" : "negative"
                }`}
              >
                {item.change}
              </span>
            </div>

            <span className="kpi-title">{item.title}</span>
            <strong className="kpi-value">{item.value}</strong>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   PANEL COMPONENTS
============================================================ */

function PanelHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: string;
}) {
  return (
    <div className="panel-header">
      <div>
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>

      {action && <button className="text-button">{action}</button>}
    </div>
  );
}

function RecentSales() {
  return (
    <section className="panel table-panel large">
      <PanelHeader
        title="Ventas recientes"
        subtitle="Últimas operaciones comerciales"
        action="Ver todas"
      />

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Operación</th>
              <th>Cliente</th>
              <th>Vendedor</th>
              <th>Total</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody>
            {recentSales.map((sale) => (
              <tr key={sale.id}>
                <td>
                  <strong>{sale.id}</strong>
                  <span className="table-secondary">{sale.hora}</span>
                </td>

                <td>{sale.cliente}</td>

                <td>{sale.vendedor}</td>

                <td>
                  <strong>
                    S/ {sale.total.toLocaleString("es-PE")}
                  </strong>
                </td>

                <td>
                  <StatusBadge status={sale.estado} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  let className = "status-neutral";

  if (
    normalized.includes("complet") ||
    normalized.includes("dispon")
  ) {
    className = "status-success";
  }

  if (
    normalized.includes("pend") ||
    normalized.includes("bajo")
  ) {
    className = "status-warning";
  }

  if (normalized.includes("cancel")) {
    className = "status-danger";
  }

  return <span className={`status-badge ${className}`}>{status}</span>;
}

/* ============================================================
   GENERIC PAGE
============================================================ */

function PageHeader({
  eyebrow = "SALESIA ENTERPRISE",
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: string;
}) {
  return (
    <div className="page-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      {action && (
        <button className="primary-button">
          <Plus size={17} />
          {action}
        </button>
      )}
    </div>
  );
}

/* ============================================================
   ADMIN
============================================================ */

function UsersPage() {
  const users = [
    ["USR-001", "Carlos Mendoza", "carlos@salesia.com", "Vendedor", "Activo"],
    ["USR-002", "María Torres", "maria@salesia.com", "Gerente", "Activo"],
    ["USR-003", "Laura Sánchez", "laura@salesia.com", "Analista", "Activo"],
    ["USR-004", "Jorge Ramírez", "jorge@salesia.com", "Almacén", "Activo"],
    ["USR-005", "Dulce Ramos", "admin@salesia.com", "Administrador", "Activo"],
  ];

  return (
    <div className="page">
      <PageHeader
        title="Usuarios"
        description="Administra los usuarios, roles y estados de acceso del sistema."
        action="Nuevo usuario"
      />

      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input placeholder="Buscar usuario..." />
        </div>

        <button className="secondary-button">
          <Filter size={16} />
          Filtrar
        </button>
      </div>

      <section className="panel table-panel">
        <PanelHeader
          title="Usuarios registrados"
          subtitle="5 usuarios encontrados"
        />

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user[0]}>
                  <td>
                    <strong>{user[0]}</strong>
                  </td>
                  <td>{user[1]}</td>
                  <td>{user[2]}</td>
                  <td>
                    <span className="role-badge">{user[3]}</span>
                  </td>
                  <td>
                    <StatusBadge status={user[4]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ActivityPage() {
  return (
    <div className="page">
      <PageHeader
        title="Actividad del sistema"
        description="Registro de operaciones importantes realizadas dentro de SalesIA."
      />

      <div className="kpi-grid">
        <SimpleKpi title="Eventos hoy" value="284" icon={Activity} />
        <SimpleKpi title="Usuarios activos" value="18" icon={Users} />
        <SimpleKpi title="Ventas registradas" value="126" icon={ShoppingCart} />
        <SimpleKpi title="Alertas generadas" value="07" icon={Bell} />
      </div>

      <section className="panel table-panel">
        <PanelHeader
          title="Historial de actividad"
          subtitle="Trazabilidad de las operaciones del sistema"
        />

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Acción</th>
                <th>Usuario</th>
                <th>Módulo</th>
                <th>Fecha</th>
                <th>Tipo</th>
              </tr>
            </thead>

            <tbody>
              {activityData.map((item) => (
                <tr key={`${item.action}-${item.time}`}>
                  <td>
                    <strong>{item.action}</strong>
                  </td>
                  <td>{item.user}</td>
                  <td>{item.module}</td>
                  <td>{item.time}</td>
                  <td>
                    <StatusBadge status="Registrado" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AlertsPage() {
  return (
    <div className="page">
      <PageHeader
        title="Alertas"
        description="Supervisa situaciones que requieren atención dentro del sistema."
      />

      <div className="alert-grid">
        <AlertCard
          type="critical"
          title="Productos bajo mínimo"
          text="2 productos presentan stock inferior al mínimo configurado."
          time="Hace 32 min"
        />

        <AlertCard
          type="warning"
          title="Pedidos pendientes"
          text="8 pedidos aún esperan procesamiento."
          time="Hace 48 min"
        />

        <AlertCard
          type="info"
          title="Análisis disponible"
          text="Se generaron nuevos resultados estadísticos."
          time="Hace 1 h"
        />

        <AlertCard
          type="success"
          title="Inventario actualizado"
          text="La última operación de entrada fue procesada correctamente."
          time="Hace 2 h"
        />
      </div>
    </div>
  );
}

function AlertCard({
  type,
  title,
  text,
  time,
}: {
  type: string;
  title: string;
  text: string;
  time: string;
}) {
  return (
    <div className={`alert-card ${type}`}>
      <div className="alert-card-icon">
        {type === "critical" && <AlertTriangle size={21} />}
        {type === "warning" && <Bell size={21} />}
        {type === "info" && <BarChart3 size={21} />}
        {type === "success" && <CheckCircle2 size={21} />}
      </div>

      <div>
        <strong>{title}</strong>
        <p>{text}</p>
        <small>{time}</small>
      </div>
    </div>
  );
}

/* ============================================================
   COMMERCIAL
============================================================ */

function SalesPage() {
  return (
    <div className="page">
      <PageHeader
        title="Ventas"
        description="Registro y seguimiento de las operaciones comerciales."
        action="Nueva venta"
      />

      <div className="kpi-grid">
        <SimpleKpi title="Ventas registradas" value="1,248" icon={ShoppingCart} />
        <SimpleKpi title="Ingresos totales" value="S/ 284,520" icon={TrendingUp} />
        <SimpleKpi title="Ticket promedio" value="S/ 228.14" icon={Calculator} />
        <SimpleKpi title="Pendientes" value="18" icon={ClipboardList} />
      </div>

      <RecentSales />

      <section className="panel chart-panel">
        <PanelHeader
          title="Ventas por periodo"
          subtitle="Evolución de las operaciones comerciales"
        />

        <div className="chart-container medium">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar
                dataKey="ventas"
                fill="#2563EB"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

function IncomePage() {
  return (
    <div className="page">
      <PageHeader
        title="Ingresos"
        description="Análisis de los ingresos generados por las operaciones comerciales."
      />

      <div className="kpi-grid">
        <SimpleKpi title="Ingresos del mes" value="S/ 284,520" icon={TrendingUp} />
        <SimpleKpi title="Ingresos anteriores" value="S/ 262,400" icon={History} />
        <SimpleKpi title="Crecimiento" value="+8.4%" icon={ArrowUpRight} />
        <SimpleKpi title="Ticket promedio" value="S/ 228.14" icon={Calculator} />
      </div>

      <section className="panel chart-panel">
        <PanelHeader
          title="Evolución de ingresos"
          subtitle="Comparación de ingresos durante el periodo"
        />

        <div className="chart-container medium">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="ingresos"
                stroke="#06B6D4"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

function ActiveCustomersPage() {
  return (
    <div className="page">
      <PageHeader
        title="Clientes activos"
        description="Consulta el comportamiento de los clientes con actividad comercial."
        action="Nuevo cliente"
      />

      <div className="kpi-grid">
        <SimpleKpi title="Clientes activos" value="864" icon={UserCheck} />
        <SimpleKpi title="Nuevos este mes" value="74" icon={Users} />
        <SimpleKpi title="Compras recurrentes" value="428" icon={TrendingUp} />
        <SimpleKpi title="Ticket promedio" value="S/ 328.42" icon={Calculator} />
      </div>

      <section className="panel">
        <PanelHeader
          title="Clientes con actividad reciente"
          subtitle="Resumen comercial"
        />

        <div className="customer-grid">
          {[
            ["Corporación Andina", "32 compras", "S/ 48,420"],
            ["Grupo Norte SAC", "24 compras", "S/ 32,180"],
            ["Innova Perú", "21 compras", "S/ 28,540"],
            ["Distribuciones Lima", "18 compras", "S/ 24,900"],
          ].map((customer) => (
            <div className="customer-card" key={customer[0]}>
              <div className="customer-avatar">
                {customer[0].charAt(0)}
              </div>

              <div>
                <strong>{customer[0]}</strong>
                <span>{customer[1]}</span>
              </div>

              <b>{customer[2]}</b>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProductsPage() {
  return (
    <div className="page">
      <PageHeader
        title="Productos"
        description="Catálogo de productos y comportamiento comercial."
        action="Nuevo producto"
      />

      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input placeholder="Buscar producto..." />
        </div>

        <button className="secondary-button">
          <Filter size={16} />
          Categoría
        </button>
      </div>

      <section className="panel table-panel">
        <PanelHeader
          title="Catálogo de productos"
          subtitle="Productos registrados en SalesIA"
        />

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Ventas</th>
                <th>Ingresos</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              {productsData.map((product) => (
                <tr key={product.producto}>
                  <td>
                    <strong>{product.producto}</strong>
                  </td>
                  <td>Computación</td>
                  <td>{product.ventas}</td>
                  <td>S/ {product.ingresos.toLocaleString("es-PE")}</td>
                  <td>
                    <StatusBadge status="Activo" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* ============================================================
   ANALYTICS
============================================================ */

function AnalyticsPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="INTELIGENCIA DE NEGOCIO"
        title="Analytics"
        description="Transforma los datos comerciales en indicadores y resultados estadísticos."
      />

      <div className="filter-bar">
        <div className="filter-label">
          <Filter size={17} />
          Filtros
        </div>

        <select>
          <option>Últimos 30 días</option>
          <option>Últimos 7 días</option>
          <option>Este mes</option>
        </select>

        <select>
          <option>Todas las categorías</option>
          <option>Computación</option>
          <option>Electrónica</option>
        </select>

        <select>
          <option>Todos los vendedores</option>
          <option>Carlos Mendoza</option>
          <option>María Torres</option>
        </select>

        <button className="primary-button compact">
          Aplicar filtros
        </button>
      </div>

      <div className="kpi-grid">
        <SimpleKpi title="Ventas" value="1,248" icon={ShoppingCart} />
        <SimpleKpi title="Ingresos" value="S/ 284,520" icon={TrendingUp} />
        <SimpleKpi title="Media" value="S/ 228.14" icon={Calculator} />
        <SimpleKpi title="Mediana" value="S/ 214.50" icon={Calculator} />
      </div>

      <div className="dashboard-grid">
        <section className="panel chart-panel large">
          <PanelHeader
            title="Evolución de ventas"
            subtitle="Ventas e ingresos por periodo"
          />

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ventas"
                  stroke="#2563EB"
                  strokeWidth={3}
                />
                <Line
                  type="monotone"
                  dataKey="ingresos"
                  stroke="#06B6D4"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel">
          <PanelHeader
            title="Distribución"
            subtitle="Participación por categoría"
          />

          <div className="pie-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={90}
                >
                  {categoryData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={["#2563EB", "#06B6D4", "#64748B", "#94A3B8"][index]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}

function KpisPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="INDICADORES EJECUTIVOS"
        title="KPIs"
        description="Indicadores principales para supervisar el comportamiento comercial."
      />

      <div className="kpi-grid kpi-large">
        <SimpleKpi title="Ventas" value="1,248" icon={ShoppingCart} />
        <SimpleKpi title="Ingresos" value="S/ 284,520" icon={TrendingUp} />
        <SimpleKpi title="Clientes activos" value="864" icon={Users} />
        <SimpleKpi title="Productos vendidos" value="3,842" icon={Package} />
        <SimpleKpi title="Ticket promedio" value="S/ 228.14" icon={Calculator} />
        <SimpleKpi title="Crecimiento" value="+8.4%" icon={ArrowUpRight} />
      </div>
    </div>
  );
}

function InsightsPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="INTELIGENCIA EMPRESARIAL"
        title="Insights"
        description="Observaciones generadas a partir de indicadores y resultados analíticos."
      />

      <div className="insight-grid">
        <InsightCard
          type="positive"
          title="Incremento de ventas"
          value="+12.8%"
          description="Las ventas muestran un incremento respecto al periodo anterior."
        />

        <InsightCard
          type="warning"
          title="Concentración de productos"
          value="42%"
          description="Electrónica representa la mayor participación de ventas."
        />

        <InsightCard
          type="analytics"
          title="Media vs. mediana"
          value="S/ 13.64"
          description="La media supera a la mediana del ticket analizado."
        />

        <InsightCard
          type="critical"
          title="Inventario"
          value="12 productos"
          description="Existen productos que requieren revisión de stock."
        />
      </div>
    </div>
  );
}

function InsightCard({
  type,
  title,
  value,
  description,
}: {
  type: string;
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className={`insight-card ${type}`}>
      <div className="insight-card-top">
        <div className="insight-icon">
          <Zap size={19} />
        </div>
        <span>INSIGHT</span>
      </div>

      <h3>{title}</h3>
      <strong>{value}</strong>
      <p>{description}</p>

      <button className="text-button">
        Ver evidencia <ChevronRight size={14} />
      </button>
    </div>
  );
}

/* ============================================================
   VENDEDORES
============================================================ */

function MySalesPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="MI ACTIVIDAD"
        title="Mis ventas"
        description="Consulta el historial de ventas registradas por ti."
        action="Nueva venta"
      />

      <div className="kpi-grid">
        <SimpleKpi title="Ventas" value="86" icon={ShoppingCart} />
        <SimpleKpi title="Ingresos" value="S/ 24,820" icon={TrendingUp} />
        <SimpleKpi title="Ticket promedio" value="S/ 288.60" icon={Calculator} />
        <SimpleKpi title="Clientes" value="32" icon={Users} />
      </div>

      <RecentSales />
    </div>
  );
}

function DailySalesPage() {
  return (
    <div className="page">
      <PageHeader
        title="Ventas del día"
        description="Resumen de tus operaciones comerciales de hoy."
      />

      <div className="kpi-grid">
        <SimpleKpi title="Ventas hoy" value="18" icon={ShoppingCart} />
        <SimpleKpi title="Ingresos hoy" value="S/ 8,420" icon={TrendingUp} />
        <SimpleKpi title="Ticket promedio" value="S/ 467.78" icon={Calculator} />
        <SimpleKpi title="Clientes" value="14" icon={UserCheck} />
      </div>

      <section className="panel chart-panel">
        <PanelHeader
          title="Ventas durante el día"
          subtitle="Distribución horaria de las operaciones"
        />

        <div className="chart-container medium">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { hora: "09:00", ventas: 2 },
                { hora: "10:00", ventas: 4 },
                { hora: "11:00", ventas: 3 },
                { hora: "12:00", ventas: 5 },
                { hora: "13:00", ventas: 1 },
                { hora: "14:00", ventas: 3 },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="hora" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="ventas" fill="#2563EB" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

function PendingOrdersPage() {
  const orders = [
    ["PED-001", "Corporación Andina", "3 productos", "S/ 4,250", "Urgente"],
    ["PED-002", "Grupo Norte SAC", "5 productos", "S/ 2,180", "Pendiente"],
    ["PED-003", "Innova Perú", "2 productos", "S/ 5,890", "Pendiente"],
  ];

  return (
    <div className="page">
      <PageHeader
        title="Pedidos pendientes"
        description="Pedidos que requieren procesamiento comercial."
      />

      <section className="panel table-panel">
        <PanelHeader
          title="Pedidos pendientes"
          subtitle="3 pedidos requieren atención"
        />

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Detalle</th>
                <th>Total</th>
                <th>Prioridad</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order[0]}>
                  <td>
                    <strong>{order[0]}</strong>
                  </td>
                  <td>{order[1]}</td>
                  <td>{order[2]}</td>
                  <td>{order[3]}</td>
                  <td>
                    <StatusBadge status={order[4]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AttendedCustomersPage() {
  return (
    <div className="page">
      <PageHeader
        title="Clientes atendidos"
        description="Clientes con los que has interactuado comercialmente."
      />

      <div className="customer-grid">
        {[
          ["Corporación Andina", "8 compras", "S/ 12,420"],
          ["Grupo Norte SAC", "6 compras", "S/ 8,180"],
          ["Innova Perú", "5 compras", "S/ 7,890"],
          ["Distribuciones Lima", "4 compras", "S/ 6,240"],
        ].map((customer) => (
          <div className="customer-card" key={customer[0]}>
            <div className="customer-avatar">
              {customer[0].charAt(0)}
            </div>

            <div>
              <strong>{customer[0]}</strong>
              <span>{customer[1]}</span>
            </div>

            <b>{customer[2]}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   ANALISTA
============================================================ */

function DatasetsPage() {
  const datasets = [
    ["DS-001", "Ventas septiembre 2026", "1,248", "Ventas", "Disponible"],
    ["DS-002", "Ticket promedio", "1,248", "Ventas", "Disponible"],
    ["DS-003", "Productos vendidos", "3,842", "Productos", "Disponible"],
    ["DS-004", "Movimientos inventario", "624", "Inventario", "Disponible"],
  ];

  return (
    <div className="page">
      <PageHeader
        eyebrow="DATOS ANALÍTICOS"
        title="Datasets"
        description="Conjuntos de datos derivados de las operaciones de SalesIA."
        action="Nuevo dataset"
      />

      <div className="kpi-grid">
        <SimpleKpi title="Datasets" value="24" icon={Database} />
        <SimpleKpi title="Observaciones" value="18,420" icon={BarChart3} />
        <SimpleKpi title="Variables" value="16" icon={Calculator} />
        <SimpleKpi title="Disponibles" value="21" icon={CheckCircle2} />
      </div>

      <section className="panel table-panel">
        <PanelHeader
          title="Datasets disponibles"
          subtitle="Información lista para análisis"
        />

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Dataset</th>
                <th>Observaciones</th>
                <th>Origen</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              {datasets.map((dataset) => (
                <tr key={dataset[0]}>
                  <td>
                    <strong>{dataset[0]}</strong>
                  </td>
                  <td>{dataset[1]}</td>
                  <td>{dataset[2]}</td>
                  <td>{dataset[3]}</td>
                  <td>
                    <StatusBadge status={dataset[4]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AnalysisPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="HISTORIAL ANALÍTICO"
        title="Análisis ejecutados"
        description="Consulta los análisis estadísticos realizados anteriormente."
      />

      <section className="panel table-panel">
        <PanelHeader
          title="Historial de análisis"
          subtitle="Últimos análisis ejecutados"
        />

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Análisis</th>
                <th>Dataset</th>
                <th>Variable</th>
                <th>Resultado</th>
                <th>Fecha</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>
                  <strong>Media aritmética</strong>
                </td>
                <td>Ventas septiembre</td>
                <td>Monto de venta</td>
                <td>S/ 228.14</td>
                <td>29/09/2026</td>
              </tr>

              <tr>
                <td>
                  <strong>Mediana</strong>
                </td>
                <td>Ventas septiembre</td>
                <td>Monto de venta</td>
                <td>S/ 214.50</td>
                <td>29/09/2026</td>
              </tr>

              <tr>
                <td>
                  <strong>Probabilidad</strong>
                </td>
                <td>Ventas septiembre</td>
                <td>Compra mayor a S/500</td>
                <td>18.4%</td>
                <td>28/09/2026</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MeanPage() {
  return (
    <StatisticalCalculator
      title="Media aritmética"
      description="Calcula la media de una variable estadística seleccionada."
      formula="Media = (x₁ + x₂ + ... + xₙ) / n"
      result="S/ 228.14"
    />
  );
}

function MedianPage() {
  return (
    <StatisticalCalculator
      title="Mediana"
      description="Determina el valor central de un conjunto de observaciones."
      formula="Mediana = valor central de los datos ordenados"
      result="S/ 214.50"
    />
  );
}

function ProbabilityPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="SEMANA 07 — PROBABILIDAD"
        title="Probabilidades"
        description="Análisis de probabilidades y preparación para el Teorema de Bayes."
      />

      <div className="stat-card-grid">
        <div className="stat-info-card">
          <div className="stat-info-icon">
            <Percent size={20} />
          </div>

          <span>Probabilidad de compra &gt; S/500</span>
          <strong>18.4%</strong>
          <small>Basado en 1,248 observaciones</small>
        </div>

        <div className="stat-info-card">
          <div className="stat-info-icon">
            <Calculator size={20} />
          </div>

          <span>Probabilidad de compra recurrente</span>
          <strong>34.8%</strong>
          <small>Clientes con más de una compra</small>
        </div>

        <div className="stat-info-card">
          <div className="stat-info-icon">
            <BarChart3 size={20} />
          </div>

          <span>Probabilidad categoría electrónica</span>
          <strong>42.0%</strong>
          <small>Participación observada</small>
        </div>
      </div>

      <section className="panel bayes-card">
        <div>
          <span className="eyebrow">TEOREMA DE BAYES</span>
          <h2>Probabilidad condicional</h2>
          <p>
            En la siguiente fase se implementará el cálculo utilizando
            datos reales provenientes de los datasets comerciales.
          </p>
        </div>

        <div className="formula-box">
          <strong>P(A|B)</strong>
          <span>=</span>
          <strong>P(B|A) × P(A)</strong>
          <span>/</span>
          <strong>P(B)</strong>
        </div>
      </section>
    </div>
  );
}

function StatisticalCalculator({
  title,
  description,
  formula,
  result,
}: {
  title: string;
  description: string;
  formula: string;
  result: string;
}) {
  return (
    <div className="page">
      <PageHeader
        eyebrow="SEMANA 07 — ESTADÍSTICA"
        title={title}
        description={description}
      />

      <div className="stat-analysis-layout">
        <section className="panel">
          <PanelHeader title="Configuración del análisis" />

          <div className="form-grid">
            <label>
              Dataset
              <select>
                <option>Ventas septiembre 2026</option>
                <option>Ticket promedio</option>
                <option>Productos vendidos</option>
              </select>
            </label>

            <label>
              Variable
              <select>
                <option>Monto de venta</option>
                <option>Cantidad de productos</option>
                <option>Número de ventas</option>
              </select>
            </label>

            <label className="full">
              Filtro
              <input placeholder="Opcional: por categoría, vendedor..." />
            </label>
          </div>

          <button className="primary-button">
            <Calculator size={17} />
            Ejecutar análisis
          </button>
        </section>

        <section className="panel result-panel">
          <span className="eyebrow">RESULTADO</span>
          <h2>{result}</h2>

          <div className="formula-result">
            <span>Fórmula</span>
            <strong>{formula}</strong>
          </div>

          <div className="result-status">
            <CheckCircle2 size={17} />
            Resultado generado correctamente
          </div>
        </section>
      </div>
    </div>
  );
}

/* ============================================================
   ALMACÉN
============================================================ */

function InventoryPage() {
  return (
    <div className="page">
      <PageHeader
        title="Inventario"
        description="Supervisión general del stock y movimientos de almacén."
      />

      <div className="kpi-grid">
        <SimpleKpi title="Productos" value="1,842" icon={Boxes} />
        <SimpleKpi title="Stock total" value="24,680" icon={Warehouse} />
        <SimpleKpi title="Bajo mínimo" value="12" icon={AlertTriangle} />
        <SimpleKpi title="Movimientos" value="624" icon={History} />
      </div>

      <InventoryTable />
    </div>
  );
}

function StockPage() {
  return (
    <div className="page">
      <PageHeader
        title="Stock"
        description="Consulta las existencias actuales de productos."
        action="Registrar entrada"
      />

      <InventoryTable />
    </div>
  );
}

function LowStockPage() {
  const lowStock = inventoryData.filter((item) => item.stock <= item.minimo);

  return (
    <div className="page">
      <PageHeader
        eyebrow="ATENCIÓN REQUERIDA"
        title="Productos bajo mínimo"
        description="Productos cuyo stock requiere reposición."
      />

      <div className="alert-grid">
        {lowStock.map((item) => (
          <AlertCard
            key={item.codigo}
            type="critical"
            title={item.producto}
            text={`Stock actual: ${item.stock} · Mínimo: ${item.minimo}`}
            time="Requiere reposición"
          />
        ))}
      </div>

      <InventoryTable onlyLowStock />
    </div>
  );
}

function InventoryTable({ onlyLowStock = false }: { onlyLowStock?: boolean }) {
  const data = onlyLowStock
    ? inventoryData.filter((item) => item.stock <= item.minimo)
    : inventoryData;

  return (
    <section className="panel table-panel">
      <PanelHeader
        title="Control de stock"
        subtitle={`${data.length} productos mostrados`}
      />

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Mínimo</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item) => (
              <tr key={item.codigo}>
                <td>
                  <strong>{item.codigo}</strong>
                </td>
                <td>{item.producto}</td>
                <td>{item.categoria}</td>
                <td>
                  <strong>{item.stock}</strong>
                </td>
                <td>{item.minimo}</td>
                <td>
                  <StatusBadge status={item.estado} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EntriesPage() {
  return <MovementPage title="Entradas" type="Entrada" icon={ArrowDownRight} />;
}

function OutputsPage() {
  return <MovementPage title="Salidas" type="Salida" icon={ArrowUpRight} />;
}

function MovementsPage() {
  return (
    <MovementPage title="Movimientos" type="Movimiento" icon={History} />
  );
}

function MovementPage({
  title,
  type,
  icon: Icon,
}: {
  title: string;
  type: string;
  icon: React.ElementType;
}) {
  const movements = [
    ["MOV-001", "Laptop Pro 15", "24", type, "29/09/2026"],
    ["MOV-002", "Monitor 24\"", "10", type, "29/09/2026"],
    ["MOV-003", "Mouse Inalámbrico", "15", type, "28/09/2026"],
    ["MOV-004", "Teclado Mecánico", "20", type, "28/09/2026"],
  ];

  return (
    <div className="page">
      <PageHeader
        title={title}
        description={`Consulta y controla las operaciones de ${title.toLowerCase()} de inventario.`}
        action={type === "Movimiento" ? undefined : `Nueva ${type.toLowerCase()}`}
      />

      <section className="panel table-panel">
        <PanelHeader
          title={`Registro de ${title.toLowerCase()}`}
          subtitle="Historial de operaciones"
        />

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Movimiento</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Tipo</th>
                <th>Fecha</th>
              </tr>
            </thead>

            <tbody>
              {movements.map((movement) => (
                <tr key={movement[0]}>
                  <td>
                    <strong>{movement[0]}</strong>
                  </td>
                  <td>{movement[1]}</td>
                  <td>{movement[2]}</td>
                  <td>
                    <span className="movement-type">
                      <Icon size={14} />
                      {movement[3]}
                    </span>
                  </td>
                  <td>{movement[4]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* ============================================================
   SIMPLE KPI
============================================================ */

function SimpleKpi({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="kpi-card">
      <div className="kpi-top">
        <div className="kpi-icon">
          <Icon size={20} />
        </div>
      </div>

      <span className="kpi-title">{title}</span>
      <strong className="kpi-value">{value}</strong>
    </div>
  );
}

export default App;
>>>>>>> 491a911a0b1ea449b899958c0dfccf356d86f6ff
