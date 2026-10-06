import {
  BarChart3,
  Boxes,
  Building2,
  ChevronRight,
  FileText,
  History,
  LayoutDashboard,
  Lightbulb,
  Percent,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  X,
} from "lucide-react";

import type {
  LucideIcon,
} from "lucide-react";

import {
  NavLink,
} from "react-router-dom";

import type {
  AuthUser,
  UserRole,
} from "../types/auth";


interface SidebarProps {
  open: boolean;
  onClose: () => void;
  user: AuthUser;
}


interface MenuItem {
  label: string;
  path: string;
  icon: LucideIcon;
  roles: UserRole[];
  end?: boolean;
}


interface MenuSection {
  title: string;
  items: MenuItem[];
}


const ALL_ROLES: UserRole[] = [
  "Administrador",
  "Gerente",
  "Vendedor",
  "Analista",
  "Almacén",
];


const SALES_ROLES: UserRole[] = [
  "Administrador",
  "Gerente",
  "Vendedor",
];


const INVENTORY_ROLES: UserRole[] = [
  "Administrador",
  "Gerente",
  "Almacén",
];


const ANALYTICS_ROLES: UserRole[] = [
  "Administrador",
  "Gerente",
  "Analista",
];


const MANAGEMENT_ROLES: UserRole[] = [
  "Administrador",
  "Gerente",
];


const menuSections: MenuSection[] = [
  {
    title: "GENERAL",
    items: [
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
        roles: ALL_ROLES,
        end: true,
      },
    ],
  },

  {
    title: "OPERACIÓN",
    items: [
      {
        label: "Ventas",
        path: "/sales",
        icon: ShoppingCart,
        roles: SALES_ROLES,
        end: true,
      },
      {
        label: "Inventario",
        path: "/inventory",
        icon: Boxes,
        roles: INVENTORY_ROLES,
        end: true,
      },
      {
        label: "Kardex",
        path: "/kardex",
        icon: History,
        roles: INVENTORY_ROLES,
        end: true,
      },
    ],
  },

  {
    title: "INTELIGENCIA",
    items: [
      {
        label: "Analytics",
        path: "/analytics",
        icon: BarChart3,
        roles: ANALYTICS_ROLES,
      },
      {
        label: "Probabilidad",
        path: "/probability",
        icon: Percent,
        roles: ANALYTICS_ROLES,
      },
      {
        label: "Insights",
        path: "/insights",
        icon: Lightbulb,
        roles: ANALYTICS_ROLES,
      },
      {
        label: "Reportes",
        path: "/reports",
        icon: FileText,
        roles: ANALYTICS_ROLES,
      },
    ],
  },

  {
    title: "ADMINISTRACIÓN",
    items: [
      {
        label: "Mantenimiento",
        path: "/maintenance",
        icon: Settings2,
        roles: MANAGEMENT_ROLES,
      },
    ],
  },

  {
    title: "CONTROL",
    items: [
      {
        label: "Auditoría",
        path: "/audit",
        icon: ShieldCheck,
        roles: [
          "Administrador",
        ],
      },
    ],
  },
];


function Sidebar({
  open,
  onClose,
  user,
}: SidebarProps) {
  const initials =
    `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`
      .toUpperCase();

  const visibleSections =
    menuSections
      .map(
        (section) => ({
          ...section,

          items:
            section.items.filter(
              (item) =>
                item.roles.includes(
                  user.role,
                ),
            ),
        }),
      )
      .filter(
        (section) =>
          section.items.length > 0,
      );

  return (
    <>
      {open && (
        <button
          type="button"
          className="sidebar-overlay"
          onClick={onClose}
          aria-label="Cerrar menú"
        />
      )}

      <aside
        className={`sidebar ${
          open
            ? "sidebar-open"
            : ""
        }`}
      >
        <div className="sidebar-header">
          <div className="brand-icon">
            <Sparkles size={21} />
          </div>

          <div className="brand-text">
            <strong>
              SalesIA
            </strong>

            <span>
              Enterprise
            </span>
          </div>

          <button
            type="button"
            className="sidebar-close"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <X size={19} />
          </button>
        </div>


        <div className="sidebar-company">
          <div className="company-icon">
            <Building2 size={19} />
          </div>

          <div>
            <span>
              Empresa activa
            </span>

            <strong>
              {user.company}
            </strong>
          </div>
        </div>


        <nav className="sidebar-nav">
          {visibleSections.map(
            (section) => (
              <div
                className="sidebar-section"
                key={section.title}
              >
                <p className="sidebar-section-title">
                  {section.title}
                </p>

                {section.items.map(
                  (item) => {
                    const Icon =
                      item.icon;

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        onClick={onClose}
                        className={({
                          isActive,
                        }) =>
                          `sidebar-item ${
                            isActive
                              ? "active"
                              : ""
                          }`
                        }
                      >
                        <span className="sidebar-item-left">
                          <Icon size={18} />

                          {item.label}
                        </span>

                        <ChevronRight
                          className="sidebar-chevron"
                          size={14}
                        />
                      </NavLink>
                    );
                  },
                )}
              </div>
            ),
          )}
        </nav>


        <div className="sidebar-profile">
          <div className="profile-avatar">
            {initials}
          </div>

          <div className="profile-data">
            <strong>
              {user.first_name}{" "}
              {user.last_name}
            </strong>

            <span>
              {user.role}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}


export default Sidebar;
