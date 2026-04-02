import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import IncidentsPage from "../features/admin/pages/IncidentsPage";
import RespondersPage from "../features/admin/pages/RespondersPage";
import DepartmentsPage from "../features/admin/pages/DepartmentsPage";
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
        element: <DashboardPage />,
      },
      {
        path: "incidents",  
        element: <IncidentsPage />,
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
      }
    ],
  },
]); 