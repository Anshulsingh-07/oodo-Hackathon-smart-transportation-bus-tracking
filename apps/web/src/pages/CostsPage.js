import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "../services/api";
import { canLogExpenses, canLogFuel } from "../lib/roles";
import { useAuth } from "../context/AuthContext";
export default function CostsPage() {
    const { user } = useAuth();
    const [message, setMessage] = useState("");
    const [vehicles, setVehicles] = useState([]);
    const [data, setData] = useState({ fuel: [], expenses: [] });
    const fuelForm = useForm();
    const expenseForm = useForm();
    const load = async () => {
        const [costRes, vehicleRes] = await Promise.all([
            api.get("/costs"),
            api.get("/vehicles"),
        ]);
        setData(costRes.data);
        setVehicles(vehicleRes.data.data.map((v) => ({ id: v.id, registration_number: v.registration_number })));
    };
    useEffect(() => {
        void load();
    }, []);
    const submitFuel = fuelForm.handleSubmit(async (values) => {
        setMessage("");
        try {
            await api.post("/costs/fuel", values);
            setMessage("Fuel log added");
            fuelForm.reset();
            await load();
        }
        catch (e) {
            setMessage(e?.response?.data?.message || "Fuel log failed");
        }
    });
    const submitExpense = expenseForm.handleSubmit(async (values) => {
        setMessage("");
        try {
            await api.post("/costs/expenses", values);
            setMessage("Expense log added");
            expenseForm.reset();
            await load();
        }
        catch (e) {
            setMessage(e?.response?.data?.message || "Expense log failed");
        }
    });
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-xl font-semibold uppercase tracking-wide", children: "Fuel and Expenses" }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [_jsxs("div", { className: "border border-mono-300 p-4 dark:border-mono-700", children: [_jsx("h2", { className: "mb-3 text-sm uppercase tracking-wide", children: "Fuel Logs" }), _jsx("div", { className: "space-y-2 text-sm", children: data.fuel.map((f) => (_jsxs("p", { children: [f.registration_number, " | ", f.liters, " L | ", f.cost, " | ", f.log_date?.slice(0, 10)] }, f.id))) }), canLogFuel(user?.role) && (_jsxs("form", { onSubmit: submitFuel, className: "mt-4 grid gap-2", children: [_jsxs("select", { className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", ...fuelForm.register("vehicleId", { required: true }), children: [_jsx("option", { value: "", children: "Vehicle" }), vehicles.map((v) => (_jsx("option", { value: v.id, children: v.registration_number }, v.id)))] }), _jsx("input", { type: "date", className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", ...fuelForm.register("logDate", { required: true }) }), _jsx("input", { type: "number", className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", placeholder: "Liters", ...fuelForm.register("liters", { required: true }) }), _jsx("input", { type: "number", className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", placeholder: "Cost", ...fuelForm.register("cost", { required: true }) }), _jsx("button", { className: "border border-mono-1000 px-3 py-2 dark:border-mono-0", type: "submit", children: "Add Fuel Log" })] }))] }), _jsxs("div", { className: "border border-mono-300 p-4 dark:border-mono-700", children: [_jsx("h2", { className: "mb-3 text-sm uppercase tracking-wide", children: "Expenses" }), _jsx("div", { className: "space-y-2 text-sm", children: data.expenses.map((f) => (_jsxs("p", { children: [f.registration_number, " | ", f.category, " | ", f.amount, " | ", f.expense_date?.slice(0, 10)] }, f.id))) }), canLogExpenses(user?.role) && (_jsxs("form", { onSubmit: submitExpense, className: "mt-4 grid gap-2", children: [_jsxs("select", { className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", ...expenseForm.register("vehicleId", { required: true }), children: [_jsx("option", { value: "", children: "Vehicle" }), vehicles.map((v) => (_jsx("option", { value: v.id, children: v.registration_number }, v.id)))] }), _jsxs("select", { className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", ...expenseForm.register("category", { required: true }), children: [_jsx("option", { value: "", children: "Category" }), _jsx("option", { value: "toll", children: "toll" }), _jsx("option", { value: "maintenance", children: "maintenance" }), _jsx("option", { value: "fine", children: "fine" }), _jsx("option", { value: "insurance", children: "insurance" }), _jsx("option", { value: "other", children: "other" })] }), _jsx("input", { type: "date", className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", ...expenseForm.register("expenseDate", { required: true }) }), _jsx("input", { type: "number", className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", placeholder: "Amount", ...expenseForm.register("amount", { required: true }) }), _jsx("input", { className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", placeholder: "Notes", ...expenseForm.register("notes") }), _jsx("button", { className: "border border-mono-1000 px-3 py-2 dark:border-mono-0", type: "submit", children: "Add Expense" })] }))] })] }), message && _jsx("p", { className: "border border-mono-400 p-2 text-sm", children: message })] }));
}
