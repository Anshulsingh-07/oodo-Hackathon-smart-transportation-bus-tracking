import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { canManageVehicles } from "../lib/roles";
export default function VehiclesPage() {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [message, setMessage] = useState("");
    const [search, setSearch] = useState("");
    const { register, handleSubmit, reset, formState } = useForm({
        defaultValues: { status: "available" },
    });
    const load = async () => {
        const response = await api.get("/vehicles", {
            params: { search },
        });
        setItems(response.data.data);
    };
    useEffect(() => {
        void load();
    }, []);
    const onSubmit = async (values) => {
        setMessage("");
        try {
            await api.post("/vehicles", values);
            setMessage("Vehicle created");
            reset({ status: "available" });
            await load();
        }
        catch (e) {
            setMessage(e?.response?.data?.message || "Could not create vehicle");
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-xl font-semibold uppercase tracking-wide", children: "Vehicle Registry" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Search by registration or model", className: "w-full border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" }), _jsx("button", { className: "border border-mono-1000 px-3 py-2 dark:border-mono-0", onClick: () => void load(), children: "Search" })] }), _jsx("div", { className: "overflow-x-auto border border-mono-300 dark:border-mono-700", children: _jsxs("table", { className: "min-w-full text-left text-sm", children: [_jsx("thead", { className: "border-b border-mono-300 dark:border-mono-700", children: _jsxs("tr", { children: [_jsx("th", { className: "px-3 py-2", children: "Registration" }), _jsx("th", { className: "px-3 py-2", children: "Model" }), _jsx("th", { className: "px-3 py-2", children: "Type" }), _jsx("th", { className: "px-3 py-2", children: "Load Capacity" }), _jsx("th", { className: "px-3 py-2", children: "Odometer" }), _jsx("th", { className: "px-3 py-2", children: "Cost" }), _jsx("th", { className: "px-3 py-2", children: "Status" })] }) }), _jsx("tbody", { children: items.map((item) => (_jsxs("tr", { className: "border-b border-mono-200 dark:border-mono-800", children: [_jsx("td", { className: "px-3 py-2", children: item.registration_number }), _jsx("td", { className: "px-3 py-2", children: item.model }), _jsx("td", { className: "px-3 py-2", children: item.type }), _jsx("td", { className: "px-3 py-2", children: item.max_load_capacity }), _jsx("td", { className: "px-3 py-2", children: item.odometer }), _jsx("td", { className: "px-3 py-2", children: item.acquisition_cost }), _jsx("td", { className: "px-3 py-2 uppercase tracking-wide", children: item.status })] }, item.id))) })] }) }), canManageVehicles(user?.role) && (_jsxs("form", { className: "grid gap-3 border border-mono-300 p-4 dark:border-mono-700 md:grid-cols-2", onSubmit: handleSubmit(onSubmit), children: [_jsx("input", { className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", placeholder: "Registration Number", ...register("registrationNumber", { required: true }) }), _jsx("input", { className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", placeholder: "Model", ...register("model", { required: true }) }), _jsx("input", { className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", placeholder: "Type", ...register("type", { required: true }) }), _jsx("input", { type: "number", className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", placeholder: "Max Load Capacity", ...register("maxLoadCapacity", { valueAsNumber: true, required: true }) }), _jsx("input", { type: "number", className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", placeholder: "Odometer", ...register("odometer", { valueAsNumber: true, required: true }) }), _jsx("input", { type: "number", className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", placeholder: "Acquisition Cost", ...register("acquisitionCost", { valueAsNumber: true, required: true }) }), _jsx("input", { className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", placeholder: "Region (optional)", ...register("region") }), _jsxs("select", { className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", ...register("status", { required: true }), children: [_jsx("option", { value: "available", children: "available" }), _jsx("option", { value: "on_trip", children: "on_trip" }), _jsx("option", { value: "in_shop", children: "in_shop" }), _jsx("option", { value: "retired", children: "retired" })] }), _jsx("button", { disabled: formState.isSubmitting, className: "border border-mono-1000 px-3 py-2 dark:border-mono-0", type: "submit", children: formState.isSubmitting ? "Saving..." : "Add Vehicle" })] })), message && _jsx("p", { className: "border border-mono-400 p-2 text-sm", children: message })] }));
}
