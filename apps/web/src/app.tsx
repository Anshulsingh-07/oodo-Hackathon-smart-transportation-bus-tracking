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

export default function App(): JSX.Element {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/vehicles" element={<VehiclesPage />} />
                    <Route path="/drivers" element={<DriversPage />} />
                    <Route path="/trips" element={<TripsPage />} />
                    <Route path="/maintenance" element={<MaintenancePage />} />
                    <Route path="/costs" element={<CostsPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}