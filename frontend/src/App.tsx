import {
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import AccessPage from "./modules/auth/AccessPage";
import LoginPage from "./modules/auth/LoginPage";

import AnalyticsPage from "./modules/analytics/AnalyticsPage";
import AuditPage from "./modules/audit/AuditPage";
import CategoriasPage from "./modules/categorias/CategoriasPage";
import CommercialPage from "./modules/commercial/CommercialPage";
import DashboardPage from "./modules/dashboard/DashboardPage";
import EmpresaPage from "./modules/empresa/EmpresaPage";
import InsightsPage from "./modules/insights/InsightsPage";
import InventoryPage from "./modules/inventory/InventoryPage";
import ProbabilidadPage from "./modules/probabilidad/ProbabilidadPage";
import ProductosPage from "./modules/productos/ProductosPage";
import ReportsPage from "./modules/reports/ReportsPage";
import SucursalesPage from "./modules/sucursales/SucursalesPage";
import NuevaVentaPage from "./modules/ventas/NuevaVentaPage";
import VentasPage from "./modules/ventas/VentasPage";

import {
  getStoredUser,
  isAuthenticated,
} from "./services/auth.service";

import type {
  UserRole,
} from "./types/auth";


function ProtectedRoute() {
  if (!isAuthenticated()) {
    return (
      <Navigate
        to="/login"
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
  const user = getStoredUser();

  if (!user) {
    return (
      <Navigate
        to="/login"
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
  if (isAuthenticated()) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return <LoginPage />;
}


function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginRoute />}
      />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
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
              element={<CommercialPage />}
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
              path="/probability"
              element={<ProbabilidadPage />}
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

      <Route
        path="/"
        element={
          <Navigate
            to={
              isAuthenticated()
                ? "/dashboard"
                : "/login"
            }
            replace
          />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to={
              isAuthenticated()
                ? "/dashboard"
                : "/login"
            }
            replace
          />
        }
      />
    </Routes>
  );
}


export default App;
