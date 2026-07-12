import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { api } from "../services/api";
export default function ReportsPage() {
    const [report, setReport] = useState(null);
    useEffect(() => {
        const load = async () => {
            const response = await api.get("/reports/summary");
            setReport(response.data);
        };
        void load();
    }, []);
    if (!report) {
        return _jsx("p", { className: "text-sm", children: "Loading reports..." });
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-xl font-semibold uppercase tracking-wide", children: "Reports" }), _jsxs("div", { className: "grid gap-3 sm:grid-cols-3", children: [_jsxs("div", { className: "border border-mono-300 p-4 dark:border-mono-700", children: [_jsx("p", { className: "text-xs uppercase tracking-wide", children: "Fuel Efficiency" }), _jsx("p", { className: "mt-2 text-2xl font-semibold", children: report.fuelEfficiency.toFixed(2) })] }), _jsxs("div", { className: "border border-mono-300 p-4 dark:border-mono-700", children: [_jsx("p", { className: "text-xs uppercase tracking-wide", children: "Fleet Utilization" }), _jsxs("p", { className: "mt-2 text-2xl font-semibold", children: [report.fleetUtilization.toFixed(2), "%"] })] }), _jsxs("div", { className: "border border-mono-300 p-4 dark:border-mono-700", children: [_jsx("p", { className: "text-xs uppercase tracking-wide", children: "Total Operational Cost" }), _jsx("p", { className: "mt-2 text-2xl font-semibold", children: report.totalOperationalCost.toFixed(2) })] })] }), _jsx("div", { className: "overflow-x-auto border border-mono-300 dark:border-mono-700", children: _jsxs("table", { className: "min-w-full text-sm", children: [_jsx("thead", { className: "border-b border-mono-300 dark:border-mono-700", children: _jsxs("tr", { children: [_jsx("th", { className: "px-3 py-2 text-left", children: "Vehicle" }), _jsx("th", { className: "px-3 py-2 text-left", children: "ROI" })] }) }), _jsx("tbody", { children: report.vehicleRoi.map((row) => (_jsxs("tr", { className: "border-b border-mono-200 dark:border-mono-800", children: [_jsx("td", { className: "px-3 py-2", children: row.registration_number }), _jsx("td", { className: "px-3 py-2", children: Number(row.roi || 0).toFixed(4) })] }, row.id))) })] }) }), _jsx("a", { href: `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/reports/summary.csv`, target: "_blank", rel: "noreferrer", className: "inline-block border border-mono-1000 px-3 py-2 dark:border-mono-0", children: "Export CSV" })] }));
}
