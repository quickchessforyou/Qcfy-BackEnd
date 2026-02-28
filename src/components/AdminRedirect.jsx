import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function AdminRedirect() {
  const { isAdminAuthenticated } = useAuth();

  return isAdminAuthenticated
    ? <Navigate to="/admin/" replace />
    : <Navigate to="/admin/login" replace />;
}
