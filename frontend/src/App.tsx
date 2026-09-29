import { Navigate, Route, Routes } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import AccessPage from "./modules/auth/AccessPage";
import CommercialPage from "./modules/commercial/CommercialPage";
import DashboardPage from "./modules/dashboard/DashboardPage";
import InventoryPage from "./modules/inventory/InventoryPage";
import AnalyticsPage from "./modules/analytics/AnalyticsPage";
import ReportsPage from "./modules/reports/ReportsPage";
import AuditPage from "./modules/audit/AuditPage";

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/commercial" element={<CommercialPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/audit" element={<AuditPage />} />
        <Route path="/access" element={<AccessPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
