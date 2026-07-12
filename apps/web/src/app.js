import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import CostsPage from "./pages/CostsPage";
import DashboardPage from "./pages/DashboardPage";
import DriversPage from "./pages/DriversPage";
import LoginPage from "./pages/LoginPage";
import MaintenancePage from "./pages/MaintenancePage";
import NotFoundPage from "./pages/NotFoundPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import TripsPage from "./pages/TripsPage";
import VehiclesPage from "./pages/VehiclesPage";
import ProtectedRoute from "./routes/ProtectedRoute";
export default function App() {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { element: _jsx(ProtectedRoute, {}), children: _jsxs(Route, { element: _jsx(AppLayout, {}), children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/dashboard", replace: true }) }), _jsx(Route, { path: "/dashboard", element: _jsx(DashboardPage, {}) }), _jsx(Route, { path: "/vehicles", element: _jsx(VehiclesPage, {}) }), _jsx(Route, { path: "/drivers", element: _jsx(DriversPage, {}) }), _jsx(Route, { path: "/trips", element: _jsx(TripsPage, {}) }), _jsx(Route, { path: "/maintenance", element: _jsx(MaintenancePage, {}) }), _jsx(Route, { path: "/costs", element: _jsx(CostsPage, {}) }), _jsx(Route, { path: "/reports", element: _jsx(ReportsPage, {}) }), _jsx(Route, { path: "/settings", element: _jsx(SettingsPage, {}) })] }) }), _jsx(Route, { path: "*", element: _jsx(NotFoundPage, {}) })] }));
}
