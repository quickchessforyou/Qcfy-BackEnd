import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function UserProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth(); // Changed to isAuthenticated to match Context

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ openLogin: true }} replace />;
  }

  return children;
}
