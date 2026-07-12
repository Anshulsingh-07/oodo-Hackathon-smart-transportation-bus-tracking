import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { api } from "../services/api";
export default function DashboardPage() {
    const [data, setData] = useState(null);
    useEffect(() => {
        const load = async () => {
            const res = await api.get("/dashboard");
            setData(res.data);
        };
        void load();
    }, []);
    if (!data) {
        return _jsx("p", { className: "text-sm", children: "Loading dashboard..." });
    }
    const cards = [
        ["Active Vehicles", data.kpis.activeVehicles],
        ["Available Vehicles", data.kpis.availableVehicles],
        ["Vehicles In Maintenance", data.kpis.inMaintenance],
        ["Active Trips", data.kpis.activeTrips],
        ["Draft Trips", data.kpis.draftTrips],
        ["Drivers On Duty", data.kpis.onDutyDrivers],
        ["Fleet Utilization (%)", data.kpis.utilization],
    ];
    return (_jsxs("div", { className: "space-y-8", children: [_jsx("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4", children: cards.map(([label, value]) => (_jsxs("article", { className: "border border-mono-300 p-4 dark:border-mono-700", children: [_jsx("p", { className: "text-xs uppercase tracking-wider", children: label }), _jsx("p", { className: "mt-2 text-2xl font-semibold", children: value })] }, label))) }), _jsxs("section", { className: "grid gap-6 lg:grid-cols-2", children: [_jsxs("div", { className: "h-72 border border-mono-300 p-4 dark:border-mono-700", children: [_jsx("h2", { className: "mb-3 text-sm uppercase tracking-wide", children: "Trip Status Distribution" }), _jsx(ResponsiveContainer, { width: "100%", height: "90%", children: _jsxs(BarChart, { data: data.charts.tripStatusDistribution, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#d9d9d9" }), _jsx(XAxis, { dataKey: "status", stroke: "#111" }), _jsx(YAxis, { stroke: "#111" }), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "count", fill: "#111" })] }) })] }), _jsxs("div", { className: "h-72 border border-mono-300 p-4 dark:border-mono-700", children: [_jsx("h2", { className: "mb-3 text-sm uppercase tracking-wide", children: "Cost Breakdown" }), _jsx(ResponsiveContainer, { width: "100%", height: "90%", children: _jsxs(BarChart, { data: data.charts.costBreakdown, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#d9d9d9" }), _jsx(XAxis, { dataKey: "bucket", stroke: "#111" }), _jsx(YAxis, { stroke: "#111" }), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "amount", fill: "#555" })] }) })] })] })] }));
}
