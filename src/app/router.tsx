import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import LoginPage from "../pages/LoginPage";

import { mockUser } from "../mockUser";

// ERU pages
import EruDashboard from "../features/admin/pages/eru/EruDashboard";
import IncidentsPage from "../features/admin/pages/eru/IncidentsPage";

// Substation pages
import SubstationDashboard from "../features/admin/pages/substation/SubstationDashboard";
import SubstationIncidentsPage from "../features/admin/pages/substation/SubstationIncidentsPage";

// Shared pages (still outside role folders)
import DepartmentsPage from "../features/admin/pages/DepartmentsPage";
import RespondersPage from "../features/admin/pages/RespondersPage";
import OfflineLogsPage from "../features/admin/pages/OfflineLogsPage";
import ProtectedRoute from "../features/auth/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: 
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>,
    children: [
      {
        index: true,
        element:
          mockUser.role === "ERU_ADMIN" ? (
            <EruDashboard />
          ) : (
            <SubstationDashboard />
          ),
      },
      {
        path: "incidents",
        element:
          mockUser.role === "ERU_ADMIN" ? (
            <IncidentsPage />
          ) : (
            <SubstationIncidentsPage />
          ),
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