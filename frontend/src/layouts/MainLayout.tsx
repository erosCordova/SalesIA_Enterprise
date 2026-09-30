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
  getCurrentUser,
  getStoredUser,
  logout,
} from "../services/auth.service";

import type {
  AuthUser,
} from "../types/auth";


function MainLayout() {
  const navigate =
    useNavigate();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [user, setUser] =
    useState<AuthUser | null>(
      () => getStoredUser(),
    );


  useEffect(() => {
    let active = true;

    getCurrentUser()
      .then(
        (currentUser) => {
          if (active) {
            setUser(
              currentUser,
            );
          }
        },
      )
      .catch(
        () => {
          logout();

          navigate(
            "/login",
            {
              replace: true,
            },
          );
        },
      );

    return () => {
      active = false;
    };
  }, [navigate]);


  function handleLogout() {
    logout();

    navigate(
      "/login",
      {
        replace: true,
      },
    );
  }


  if (!user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f8fafc",
          color: "#64748b",
        }}
      >
        Cargando sesión...
      </div>
    );
  }


  return (
    <div className="app-shell">
      <Sidebar
        open={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
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
