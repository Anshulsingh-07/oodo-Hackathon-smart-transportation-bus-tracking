import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { canManageDrivers } from "../lib/roles";
export default function DriversPage() {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [message, setMessage] = useState("");
    const { register, handleSubmit, reset, formState } = useForm({
        defaultValues: { status: "available", suspended: false, safetyScore: 80 },
    });
    const load = async () => {
        const response = await api.get("/drivers");
        setItems(response.data.data);
    };
    useEffect(() => {
        void load();
    }, []);
    const onSubmit = async (values) => {
        setMessage("");
        try {
            await api.post("/drivers", values);
            setMessage("Driver created");
            reset({ status: "available", suspended: false, safetyScore: 80 });
            await load();
        }
        catch (e) {
            setMessage(e?.response?.data?.message || "Could not create driver");
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-xl font-semibold uppercase tracking-wide", children: "Driver Management" }), _jsx("div", { className: "overflow-x-auto border border-mono-300 dark:border-mono-700", children: _jsxs("table", { className: "min-w-full text-left text-sm", children: [_jsx("thead", { className: "border-b border-mono-300 dark:border-mono-700", children: _jsxs("tr", { children: [_jsx("th", { className: "px-3 py-2", children: "Name" }), _jsx("th", { className: "px-3 py-2", children: "License Number" }), _jsx("th", { className: "px-3 py-2", children: "Category" }), _jsx("th", { className: "px-3 py-2", children: "Expiry Date" }), _jsx("th", { className: "px-3 py-2", children: "Contact" }), _jsx("th", { className: "px-3 py-2", children: "Safety Score" }), _jsx("th", { className: "px-3 py-2", children: "Status" }), _jsx("th", { className: "px-3 py-2", children: "License State" })] }) }), _jsx("tbody", { children: items.map((item) => (_jsxs("tr", { className: "border-b border-mono-200 dark:border-mono-800", children: [_jsx("td", { className: "px-3 py-2", children: item.name }), _jsx("td", { className: "px-3 py-2", children: item.license_number }), _jsx("td", { className: "px-3 py-2", children: item.license_category }), _jsx("td", { className: "px-3 py-2", children: item.license_expiry_date?.slice(0, 10) }), _jsx("td", { className: "px-3 py-2", children: item.contact_number }), _jsx("td", { className: "px-3 py-2", children: item.safety_score }), _jsx("td", { className: "px-3 py-2 uppercase tracking-wide", children: item.status }), _jsx("td", { className: "px-3 py-2 font-semibold uppercase tracking-wide", children: item.license_status_label })] }, item.id))) })] }) }), canManageDrivers(user?.role) && (_jsxs("form", { className: "grid gap-3 border border-mono-300 p-4 dark:border-mono-700 md:grid-cols-2", onSubmit: handleSubmit(onSubmit), children: [_jsx("input", { className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", placeholder: "Name", ...register("name", { required: true }) }), _jsx("input", { className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", placeholder: "License Number", ...register("licenseNumber", { required: true }) }), _jsx("input", { className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", placeholder: "License Category", ...register("licenseCategory", { required: true }) }), _jsx("input", { type: "date", className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", ...register("licenseExpiryDate", { required: true }) }), _jsx("input", { className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", placeholder: "Contact Number", ...register("contactNumber", { required: true }) }), _jsx("input", { className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", placeholder: "Email", ...register("email") }), _jsx("input", { type: "number", className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", placeholder: "Safety Score", ...register("safetyScore", { valueAsNumber: true, required: true }) }), _jsxs("select", { className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", ...register("status", { required: true }), children: [_jsx("option", { value: "available", children: "available" }), _jsx("option", { value: "on_trip", children: "on_trip" }), _jsx("option", { value: "off_duty", children: "off_duty" }), _jsx("option", { value: "suspended", children: "suspended" })] }), _jsxs("label", { className: "flex items-center gap-2 border border-mono-400 px-3 py-2 dark:border-mono-700", children: [_jsx("input", { type: "checkbox", ...register("suspended") }), "Suspended"] }), _jsx("button", { disabled: formState.isSubmitting, className: "border border-mono-1000 px-3 py-2 dark:border-mono-0", type: "submit", children: formState.isSubmitting ? "Saving..." : "Add Driver" })] })), message && _jsx("p", { className: "border border-mono-400 p-2 text-sm", children: message })] }));
}
