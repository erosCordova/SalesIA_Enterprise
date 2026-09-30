import {
  Bell,
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
          className="mobile-menu-button"
          onClick={onMenuClick}
        >
          <Menu size={22} />
        </button>

        <div className="topbar-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Buscar ventas, clientes, productos..."
          />

          <span className="search-shortcut">
            Ctrl K
          </span>
        </div>
      </div>

      <div className="topbar-actions">
        <button
          className="icon-button notification-button"
          title="Notificaciones"
        >
          <Bell size={20} />
          <span className="notification-dot" />
        </button>

        <button
          className="icon-button"
          onClick={onLogout}
          title="Cerrar sesión"
        >
          <LogOut size={20} />
        </button>

        <div className="topbar-divider" />

        <div className="user-menu">
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
        </div>
      </div>
    </header>
  );
}


export default Topbar;
