import {
  LogOut,
  Menu,
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
          title="Abrir menú"
        >
          <Menu size={22} />
        </button>

        <div className="topbar-context">
          <span>
            SalesIA Enterprise
          </span>

          <strong>
            {user.company || "Empresa activa"}
          </strong>
        </div>
      </div>

      <div className="topbar-actions">
        <button
          type="button"
          className="icon-button"
          onClick={onLogout}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
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
