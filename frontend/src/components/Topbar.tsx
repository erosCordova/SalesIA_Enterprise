import {
  Bell,
  ChevronDown,
  Menu,
  Search,
} from "lucide-react";

interface TopbarProps {
  onMenuClick: () => void;
}

function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="mobile-menu-button" onClick={onMenuClick}>
          <Menu size={22} />
        </button>

        <div className="topbar-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Buscar ventas, clientes, productos..."
          />

          <span className="search-shortcut">⌘ K</span>
        </div>
      </div>

      <div className="topbar-actions">
        <button className="icon-button notification-button">
          <Bell size={20} />
          <span className="notification-dot" />
        </button>

        <div className="topbar-divider" />

        <button className="user-menu">
          <div className="user-avatar">AD</div>

          <div className="user-info">
            <strong>Administrador</strong>
            <span>Administrador general</span>
          </div>

          <ChevronDown size={16} />
        </button>
      </div>
    </header>
  );
}

export default Topbar;
