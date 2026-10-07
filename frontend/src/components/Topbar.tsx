import {
  Bell,
  ChevronDown,
  CircleHelp,
  LogOut,
  Menu,
  Search,
} from "lucide-react";

import type {
  AuthUser,
} from "../types/auth";


interface TopbarProps {
  onMenuClick: () => void;
  onLogout: () => void;
  user: AuthUser;
}


function Topbar({
  onMenuClick,
  onLogout,
  user,
}: TopbarProps) {
  const initials =
    `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`
      .toUpperCase();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="mobile-menu-button"
          onClick={onMenuClick}
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>

        <label className="topbar-search">
          <Search size={16} />

          <input
            type="search"
            placeholder="Buscar productos, clientes, ventas..."
          />
        </label>
      </div>

      <div className="topbar-actions">
        <button
          type="button"
          className="modern-topbar-icon notification-button"
          title="Notificaciones"
        >
          <Bell size={17} />

          <span className="notification-dot" />
        </button>

        <button
          type="button"
          className="modern-topbar-icon"
          title="Ayuda"
        >
          <CircleHelp size={17} />
        </button>

        <div className="topbar-divider" />

        <div className="user-menu modern-user-menu">
          <div className="user-avatar">
            {initials}
          </div>

          <div className="user-info">
            <strong>
              {user.first_name}{" "}
              {user.last_name}
            </strong>

            <span>
              {user.role}
            </span>
          </div>

          <ChevronDown
            className="modern-user-chevron"
            size={14}
          />
        </div>

        <button
          type="button"
          className="modern-logout-button"
          onClick={onLogout}
          title="Cerrar sesión"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}


export default Topbar;
