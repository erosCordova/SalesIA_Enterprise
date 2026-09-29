import {
  BarChart3,
  Boxes,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";

import { NavLink } from "react-router-dom";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const menuItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
    end: true,
  },
  {
    label: "Gestión comercial",
    icon: ShoppingCart,
    path: "/commercial",
  },
  {
    label: "Inventario",
    icon: Boxes,
    path: "/inventory",
  },
  {
    label: "Analytics",
    icon: BarChart3,
    path: "/analytics",
  },
  {
    label: "Reportes",
    icon: ClipboardList,
    path: "/reports",
  },
  {
    label: "Auditoría",
    icon: ShieldCheck,
    path: "/audit",
  },
];

function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <button
          className="sidebar-overlay"
          onClick={onClose}
          aria-label="Cerrar menú"
        />
      )}

      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <div className="brand-icon">
            <Sparkles size={22} />
          </div>

          <div className="brand-text">
            <strong>SalesIA</strong>
            <span>Enterprise</span>
          </div>

          <button
            className="sidebar-close"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-company">
          <div className="company-icon">
            <ShoppingCart size={20} />
          </div>

          <div>
            <span>Empresa activa</span>
            <strong>SalesIA Demo</strong>
          </div>
        </div>

        <nav className="sidebar-nav">
          <p className="sidebar-section-title">NAVEGACIÓN</p>

          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.label}
                to={item.path}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `sidebar-item ${isActive ? "active" : ""}`
                }
              >
                <span className="sidebar-item-left">
                  <Icon size={19} />
                  {item.label}
                </span>

                <ChevronRight size={16} />
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <NavLink
            to="/access"
            onClick={onClose}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? "active" : ""}`
            }
          >
            <span className="sidebar-item-left">
              <UsersRound size={19} />
              Acceso y seguridad
            </span>

            <ChevronRight size={16} />
          </NavLink>

          <button className="sidebar-item">
            <span className="sidebar-item-left">
              <Settings size={19} />
              Configuración
            </span>

            <ChevronRight size={16} />
          </button>
        </div>

        <div className="sidebar-profile">
          <div className="profile-avatar">AD</div>

          <div className="profile-data">
            <strong>Administrador</strong>
            <span>admin@salesia.pe</span>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
