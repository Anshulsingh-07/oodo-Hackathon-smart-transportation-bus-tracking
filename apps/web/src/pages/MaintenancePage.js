import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { canManageMaintenance } from "../lib/roles";
export default function MaintenancePage() {
    const { user } = useAuth();
    const [records, setRecords] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [message, setMessage] = useState("");
    const { register, handleSubmit, reset, formState } = useForm();
    const load = async () => {
        const [maintRes, vehRes] = await Promise.all([
            api.get("/maintenance"),
            api.get("/vehicles/assignable"),
        ]);
        setRecords(maintRes.data);
        setVehicles(vehRes.data);
    };
    useEffect(() => {
        void load();
    }, []);
    const onSubmit = async (values) => {
        setMessage("");
        try {
            await api.post("/maintenance", values);
            setMessage("Maintenance opened and vehicle moved to in shop");
            reset();
            await load();
        }
        catch (e) {
            setMessage(e?.response?.data?.message || "Could not create maintenance");
        }
    };
    const closeRecord = async (id) => {
        setMessage("");
        try {
            await api.post(`/maintenance/${id}/close`);
            setMessage("Maintenance closed");
            await load();
        }
        catch (e) {
            setMessage(e?.response?.data?.message || "Could not close maintenance");
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-xl font-semibold uppercase tracking-wide", children: "Maintenance" }), _jsx("div", { className: "overflow-x-auto border border-mono-300 dark:border-mono-700", children: _jsxs("table", { className: "min-w-full text-sm", children: [_jsx("thead", { className: "border-b border-mono-300 dark:border-mono-700", children: _jsxs("tr", { children: [_jsx("th", { className: "px-3 py-2 text-left", children: "Vehicle" }), _jsx("th", { className: "px-3 py-2 text-left", children: "Type" }), _jsx("th", { className: "px-3 py-2 text-left", children: "Cost" }), _jsx("th", { className: "px-3 py-2 text-left", children: "Status" }), _jsx("th", { className: "px-3 py-2 text-left", children: "Action" })] }) }), _jsx("tbody", { children: records.map((item) => (_jsxs("tr", { className: "border-b border-mono-200 dark:border-mono-800", children: [_jsx("td", { className: "px-3 py-2", children: item.registration_number }), _jsx("td", { className: "px-3 py-2", children: item.maintenance_type }), _jsx("td", { className: "px-3 py-2", children: item.cost }), _jsx("td", { className: "px-3 py-2 uppercase tracking-wide", children: item.status }), _jsx("td", { className: "px-3 py-2", children: canManageMaintenance(user?.role) && item.status === "open" && (_jsx("button", { className: "border border-mono-1000 px-2 py-1 dark:border-mono-0", onClick: () => void closeRecord(item.id), children: "Close" })) })] }, item.id))) })] }) }), canManageMaintenance(user?.role) && (_jsxs("form", { className: "grid gap-3 border border-mono-300 p-4 dark:border-mono-700 md:grid-cols-2", onSubmit: handleSubmit(onSubmit), children: [_jsxs("select", { className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", ...register("vehicleId", { valueAsNumber: true, required: true }), children: [_jsx("option", { value: "", children: "Select vehicle" }), vehicles.map((vehicle) => (_jsx("option", { value: vehicle.id, children: vehicle.registration_number }, vehicle.id)))] }), _jsx("input", { className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", placeholder: "Maintenance Type", ...register("maintenanceType", { required: true }) }), _jsx("input", { className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", placeholder: "Description", ...register("description", { required: true }) }), _jsx("input", { type: "number", className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", placeholder: "Cost", ...register("cost", { valueAsNumber: true, required: true }) }), _jsx("button", { type: "submit", disabled: formState.isSubmitting, className: "border border-mono-1000 px-3 py-2 dark:border-mono-0", children: formState.isSubmitting ? "Saving..." : "Create Open Maintenance" })] })), message && _jsx("p", { className: "border border-mono-400 p-2 text-sm", children: message })] }));
}
