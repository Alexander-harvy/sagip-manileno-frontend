import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import LoginPage from "../pages/LoginPage";
import { storage } from "../utils/storage";

// ERU pages
import EruDashboard from "../features/admin/pages/eru/EruDashboard";
import IncidentsPage from "../features/admin/pages/eru/IncidentsPage";

// Substation pages
import SubstationDashboard from "../features/admin/pages/substation/SubstationDashboard";
import SubstationIncidentsPage from "../features/admin/pages/substation/SubstationIncidentsPage";

// Shared pages
import DepartmentsPage from "../features/admin/pages/DepartmentsPage";
import RespondersPage from "../features/admin/pages/RespondersPage";
import OfflineLogsPage from "../features/admin/pages/OfflineLogsPage";
import ProtectedRoute from "../features/auth/ProtectedRoute";

function DashboardByRole() {
  const user = storage.getUser();
  return user?.role === "ERU_ADMIN" ? <EruDashboard /> : <SubstationDashboard />;
}

function IncidentsByRole() {
  const user = storage.getUser();
  return user?.role === "ERU_ADMIN" ? <IncidentsPage /> : <SubstationIncidentsPage />;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardByRole />,
      },
      {
        path: "incidents",
        element: <IncidentsByRole />,
      },
      {
        path: "responders",
        element: <RespondersPage />,
      },
      {
        path: "departments",
        element: <DepartmentsPage />,
      },
      {
        path: "offline-logs",
        element: <OfflineLogsPage />,
      },
    ],
  },
]);