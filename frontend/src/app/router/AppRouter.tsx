import {
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";

import MainLayout from "../../layouts/MainLayout";

import {
  useAuth,
} from "../../services/auth.context";

import type {
  UserRole,
} from "../../types/auth";

import AccessPage from "../../modules/auth/AccessPage";
import LoginPage from "../../modules/auth/LoginPage";

import AnalyticsPage from "../../modules/analytics/AnalyticsPage";
import AuditPage from "../../modules/audit/AuditPage";
import CategoriasPage from "../../modules/categorias/CategoriasPage";
import ClientePortalPage from "../../modules/cliente/ClientePortalPage";
import ClientesPage from "../../modules/clientes/ClientesPage";
import DashboardPage from "../../modules/dashboard/DashboardPage";
import EmpresaPage from "../../modules/empresa/EmpresaPage";
import LandingPage from "../../modules/home/LandingPage";
import InsightsPage from "../../modules/insights/InsightsPage";
import InventoryPage from "../../modules/inventory/InventoryPage";
import KardexPage from "../../modules/kardex/KardexPage";
import MantenimientoPage from "../../modules/mantenimiento/MantenimientoPage";
import ProbabilidadPage from "../../modules/probabilidad/ProbabilidadPage";
import ProductosPage from "../../modules/productos/ProductosPage";
import ReportsPage from "../../modules/reports/ReportsPage";
import StatisticsPage from "../../modules/statistics/StatisticsPage";
import SucursalesPage from "../../modules/sucursales/SucursalesPage";
import NuevaVentaPage from "../../modules/ventas/NuevaVentaPage";
import VentasPage from "../../modules/ventas/VentasPage";


const STAFF_ROLES: UserRole[] = [
  "Administrador",
  "Gerente",
  "Vendedor",
  "Analista",
  "Almacén",
];


function LoadingScreen() {
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
          Validando sesión...
        </span>
      </div>
    </div>
  );
}


function ProtectedRoute() {
  const {
    authenticated,
    loading,
  } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!authenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <Outlet />;
}


function StaffRoute() {
  const {
    user,
    loading,
  } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (user.role === "Cliente") {
    return (
      <Navigate
        to="/portal"
        replace
      />
    );
  }

  if (!STAFF_ROLES.includes(user.role)) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <Outlet />;
}


function CustomerRoute() {
  const {
    user,
    loading,
  } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (user.role !== "Cliente") {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return <Outlet />;
}


function RoleRoute({
  allowed,
}: {
  allowed: UserRole[];
}) {
  const {
    user,
    loading,
  } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (user.role === "Cliente") {
    return (
      <Navigate
        to="/portal"
        replace
      />
    );
  }

  if (!allowed.includes(user.role)) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return <Outlet />;
}


function LoginRoute() {
  const {
    authenticated,
    loading,
    user,
  } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (authenticated && user) {
    return (
      <Navigate
        to={
          user.role === "Cliente"
            ? "/portal"
            : "/dashboard"
        }
        replace
      />
    );
  }

  return <LoginPage />;
}


export default function AppRouter() {
  return (
    <Routes>
      {/* ================================================
          LANDING PAGE PÚBLICA (Raíz "/")
          ================================================ */}
      <Route
        path="/"
        element={<LandingPage />}
      />

      <Route
        path="/login"
        element={<LoginRoute />}
      />

      <Route
        element={<ProtectedRoute />}
      >
        {/* ================================================
            PORTAL EXCLUSIVO DEL CLIENTE
            ================================================ */}
        <Route
          element={<CustomerRoute />}
        >
          <Route
            path="/portal"
            element={<ClientePortalPage />}
          />
        </Route>


        {/* ================================================
            SISTEMA INTERNO
            EL CLIENTE NO PUEDE ENTRAR AQUÍ
            ================================================ */}
        <Route
          element={<StaffRoute />}
        >
          <Route
            element={<MainLayout />}
          >
            <Route
              path="/dashboard"
              element={<DashboardPage />}
            />


            <Route
              element={
                <RoleRoute
                  allowed={[
                    "Administrador",
                    "Gerente",
                    "Vendedor",
                  ]}
                />
              }
            >
              <Route
                path="/commercial"
                element={<ClientesPage />}
              />

              <Route
                path="/sales"
                element={<VentasPage />}
              />
            </Route>


            <Route
              element={
                <RoleRoute
                  allowed={[
                    "Administrador",
                    "Vendedor",
                  ]}
                />
              }
            >
              <Route
                path="/sales/new"
                element={<NuevaVentaPage />}
              />
            </Route>


            <Route
              element={
                <RoleRoute
                  allowed={[
                    "Administrador",
                    "Gerente",
                    "Vendedor",
                    "Almacén",
                  ]}
                />
              }
            >
              <Route
                path="/products"
                element={<ProductosPage />}
              />
            </Route>


            <Route
              element={
                <RoleRoute
                  allowed={[
                    "Administrador",
                    "Gerente",
                    "Almacén",
                  ]}
                />
              }
            >
              <Route
                path="/categories"
                element={<CategoriasPage />}
              />

              <Route
                path="/inventory"
                element={<InventoryPage />}
              />

              <Route
                path="/kardex"
                element={<KardexPage />}
              />
            </Route>


            <Route
              element={
                <RoleRoute
                  allowed={[
                    "Administrador",
                    "Gerente",
                  ]}
                />
              }
            >
              <Route
                path="/company"
                element={<EmpresaPage />}
              />

              <Route
                path="/branches"
                element={<SucursalesPage />}
              />

              <Route
                path="/maintenance"
                element={<MantenimientoPage />}
              />
            </Route>


            <Route
              element={
                <RoleRoute
                  allowed={[
                    "Administrador",
                    "Gerente",
                    "Analista",
                  ]}
                />
              }
            >
              <Route
                path="/analytics"
                element={<AnalyticsPage />}
              />

              <Route
                path="/forecasts"
                element={<ProbabilidadPage />}
              />

              <Route
                path="/probability"
                element={
                  <Navigate
                    to="/forecasts"
                    replace
                  />
                }
              />

              <Route
                path="/statistics"
                element={<StatisticsPage />}
              />

              <Route
                path="/insights"
                element={<InsightsPage />}
              />

              <Route
                path="/reports"
                element={<ReportsPage />}
              />
            </Route>


            <Route
              element={
                <RoleRoute
                  allowed={[
                    "Administrador",
                  ]}
                />
              }
            >
              <Route
                path="/audit"
                element={<AuditPage />}
              />

              <Route
                path="/access"
                element={<AccessPage />}
              />
            </Route>
          </Route>
        </Route>
      </Route>

      {/* Ruta comodín para cualquier otra URL no existente redirige a la Landing Page */}
      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
}