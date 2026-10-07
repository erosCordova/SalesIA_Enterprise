import {
  useEffect,
  useState,
} from "react";

import {
  Outlet,
  useNavigate,
} from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import {
  useAuth,
} from "../services/auth.context";

function MainLayout() {
  const navigate =
    useNavigate();

  const {
    user,
    loading,
    logout,
  } = useAuth();

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate(
        "/login",
        { replace: true },
      );
    }
  }, [
    loading,
    user,
    navigate,
  ]);

  function handleLogout() {
    logout();

    navigate(
      "/login",
      { replace: true },
    );
  }

  if (loading || !user) {
    return (
      <div className="app-loading-screen">
        <div className="app-loading-card">
          <div className="app-loading-mark">
            S
          </div>

          <strong>
            SalesIA Enterprise
          </strong>

          <span>
            Cargando sesión...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell reference-shell">
      <Sidebar
        open={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
        onLogout={handleLogout}
        user={user}
      />

      <div className="app-content">
        <Topbar
          onMenuClick={() =>
            setSidebarOpen(true)
          }
          onLogout={handleLogout}
          user={user}
        />

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
