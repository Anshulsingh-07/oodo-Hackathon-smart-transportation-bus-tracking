import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { api } from "../services/api";
export default function SettingsPage() {
    const [items, setItems] = useState([]);
    const load = async () => {
        const response = await api.get("/notifications");
        setItems(response.data);
    };
    useEffect(() => {
        void load();
    }, []);
    const markRead = async (id) => {
        await api.post(`/notifications/${id}/read`);
        await load();
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-xl font-semibold uppercase tracking-wide", children: "Settings and Notifications" }), _jsxs("section", { className: "border border-mono-300 p-4 dark:border-mono-700", children: [_jsx("h2", { className: "mb-3 text-sm uppercase tracking-wide", children: "License and Safety Alerts" }), _jsx("div", { className: "space-y-2", children: items.map((item) => (_jsxs("div", { className: "flex flex-col gap-2 border border-mono-200 p-3 text-sm dark:border-mono-800 md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { children: [_jsx("p", { children: item.message }), _jsx("p", { className: "text-xs uppercase tracking-wide", children: item.created_at?.slice(0, 19).replace("T", " ") })] }), !item.read_at && (_jsx("button", { className: "border border-mono-1000 px-2 py-1 dark:border-mono-0", onClick: () => void markRead(item.id), children: "Mark Read" }))] }, item.id))) })] })] }));
}
