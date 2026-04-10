import { Navigate } from "react-router-dom";
import { storage } from "../../utils/storage";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = storage.getToken();
  const user = storage.getUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
export default ProtectedRoute;