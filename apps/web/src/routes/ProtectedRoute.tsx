import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute(): JSX.Element {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-6 text-sm">Loading session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
