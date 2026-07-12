import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
const schema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});
export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [error, setError] = useState("");
    const { register, handleSubmit, formState: { errors, isSubmitting }, } = useForm({ resolver: zodResolver(schema) });
    const onSubmit = async (values) => {
        setError("");
        try {
            await login(values.email, values.password);
            navigate("/dashboard");
        }
        catch (e) {
            setError(e?.response?.data?.message || "Login failed");
        }
    };
    return (_jsx("div", { className: "flex min-h-screen items-center justify-center bg-mono-50 p-4 text-mono-1000", children: _jsxs("form", { className: "w-full max-w-md border border-mono-300 bg-mono-0 p-8 dark:border-mono-700 dark:bg-mono-1000 dark:text-mono-0", onSubmit: handleSubmit(onSubmit), children: [_jsx("h1", { className: "text-2xl font-semibold uppercase tracking-wide", children: "TransitOps Login" }), _jsx("p", { className: "mt-2 text-sm text-mono-700 dark:text-mono-300", children: "Sign in with your enterprise credentials." }), _jsxs("div", { className: "mt-6 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs uppercase tracking-wide", children: "Email" }), _jsx("input", { className: "w-full border border-mono-400 px-3 py-2 outline-none focus:border-mono-1000 dark:border-mono-600 dark:bg-mono-900 dark:focus:border-mono-0", ...register("email") }), errors.email && _jsx("p", { className: "mt-1 text-xs", children: errors.email.message })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs uppercase tracking-wide", children: "Password" }), _jsx("input", { type: "password", className: "w-full border border-mono-400 px-3 py-2 outline-none focus:border-mono-1000 dark:border-mono-600 dark:bg-mono-900 dark:focus:border-mono-0", ...register("password") }), errors.password && _jsx("p", { className: "mt-1 text-xs", children: errors.password.message })] })] }), error && _jsx("p", { className: "mt-4 border border-mono-400 p-2 text-sm", children: error }), _jsx("button", { type: "submit", disabled: isSubmitting, className: "mt-6 w-full border border-mono-1000 bg-mono-1000 px-4 py-2 text-mono-0 disabled:opacity-60 dark:border-mono-0 dark:bg-mono-0 dark:text-mono-1000", children: isSubmitting ? "Signing in..." : "Login" })] }) }));
}
