import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
export default function NotFoundPage() {
    return (_jsxs("div", { className: "p-8", children: [_jsx("h1", { className: "text-xl font-semibold uppercase tracking-wide", children: "Page not found" }), _jsx("p", { className: "mt-2 text-sm", children: "The page you requested does not exist." }), _jsx(Link, { className: "mt-4 inline-block border border-mono-1000 px-3 py-2 dark:border-mono-0", to: "/dashboard", children: "Go to dashboard" })] }));
}
