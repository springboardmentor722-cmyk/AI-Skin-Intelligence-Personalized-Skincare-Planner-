import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loading from "./Loading";

/**
 * Wraps a route so it requires authentication, and optionally one of a
 * set of allowed roles. Unauthenticated users are redirected to /login;
 * authenticated users with the wrong role are redirected to their own
 * dashboard rather than seeing a dead end.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) return <Loading label="Verifying session" />;

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={roleHomePath(user.role)} replace />;
  }

  return children;
}

export function roleHomePath(role) {
  switch (role) {
    case "Administrator":
      return "/admin/dashboard";
    case "Skincare Consultant":
      return "/consultant/dashboard";
    case "Dermatologist":
      return "/dermatologist/dashboard";
    default:
      return "/dashboard";
  }
}
