import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
export default function ProtectedRoute() {
    const { user, isLoading } = useAuth();
    if (isLoading) {
        return _jsx("div", { className: "p-6 text-sm", children: "Loading session..." });
    }
    if (!user) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    return _jsx(Outlet, {});
}
