import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { canCreateTrips } from "../lib/roles";
export default function TripsPage() {
    const { user } = useAuth();
    const [trips, setTrips] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [message, setMessage] = useState("");
    const [actionBusy, setActionBusy] = useState(null);
    const { register, watch, handleSubmit, reset, formState } = useForm();
    const selectedVehicleId = Number(watch("vehicleId"));
    const cargoWeight = Number(watch("cargoWeight") || 0);
    const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
    const overweight = selectedVehicle && cargoWeight > Number(selectedVehicle.max_load_capacity);
    const load = async () => {
        const [tripRes, vehicleRes, driverRes] = await Promise.all([
            api.get("/trips"),
            api.get("/vehicles/assignable"),
            api.get("/drivers/assignable"),
        ]);
        setTrips(tripRes.data);
        setVehicles(vehicleRes.data);
        setDrivers(driverRes.data);
    };
    useEffect(() => {
        void load();
    }, []);
    const submit = async (values) => {
        if (overweight) {
            setMessage("Cargo weight exceeds selected vehicle capacity");
            return;
        }
        setMessage("");
        try {
            await api.post("/trips", values);
            setMessage("Trip created as draft");
            reset();
            await load();
        }
        catch (e) {
            setMessage(e?.response?.data?.message || "Could not create trip");
        }
    };
    const dispatchTrip = async (id) => {
        setActionBusy(id);
        setMessage("");
        try {
            await api.post(`/trips/${id}/dispatch`);
            setMessage("Trip dispatched");
            await load();
        }
        catch (e) {
            setMessage(e?.response?.data?.message || "Dispatch failed");
        }
        finally {
            setActionBusy(null);
        }
    };
    const completeTrip = async (id) => {
        const actualDistance = Number(window.prompt("Actual distance", "100") || 0);
        const fuelConsumed = Number(window.prompt("Fuel consumed", "10") || 0);
        const finalOdometer = Number(window.prompt("Final odometer", "1000") || 0);
        setActionBusy(id);
        try {
            await api.post(`/trips/${id}/complete`, {
                actualDistance,
                fuelConsumed,
                finalOdometer,
            });
            setMessage("Trip completed");
            await load();
        }
        catch (e) {
            setMessage(e?.response?.data?.message || "Complete failed");
        }
        finally {
            setActionBusy(null);
        }
    };
    const cancelTrip = async (id) => {
        setActionBusy(id);
        try {
            await api.post(`/trips/${id}/cancel`);
            setMessage("Trip cancelled");
            await load();
        }
        catch (e) {
            setMessage(e?.response?.data?.message || "Cancel failed");
        }
        finally {
            setActionBusy(null);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-xl font-semibold uppercase tracking-wide", children: "Trip Management" }), _jsx("div", { className: "overflow-x-auto border border-mono-300 dark:border-mono-700", children: _jsxs("table", { className: "min-w-full text-sm", children: [_jsx("thead", { className: "border-b border-mono-300 dark:border-mono-700", children: _jsxs("tr", { children: [_jsx("th", { className: "px-3 py-2 text-left", children: "Route" }), _jsx("th", { className: "px-3 py-2 text-left", children: "Vehicle" }), _jsx("th", { className: "px-3 py-2 text-left", children: "Driver" }), _jsx("th", { className: "px-3 py-2 text-left", children: "Cargo" }), _jsx("th", { className: "px-3 py-2 text-left", children: "Status" }), _jsx("th", { className: "px-3 py-2 text-left", children: "Actions" })] }) }), _jsx("tbody", { children: trips.map((trip) => (_jsxs("tr", { className: "border-b border-mono-200 dark:border-mono-800", children: [_jsxs("td", { className: "px-3 py-2", children: [trip.source, " to ", trip.destination] }), _jsx("td", { className: "px-3 py-2", children: trip.registration_number }), _jsx("td", { className: "px-3 py-2", children: trip.driver_name }), _jsx("td", { className: "px-3 py-2", children: trip.cargo_weight }), _jsx("td", { className: "px-3 py-2 uppercase tracking-wide", children: trip.status }), _jsxs("td", { className: "px-3 py-2", children: [canCreateTrips(user?.role) && trip.status === "draft" && (_jsx("button", { disabled: actionBusy === trip.id, onClick: () => void dispatchTrip(trip.id), className: "border border-mono-1000 px-2 py-1 text-xs disabled:opacity-60 dark:border-mono-0", children: actionBusy === trip.id ? "Processing..." : "Dispatch" })), canCreateTrips(user?.role) && trip.status === "dispatched" && (_jsxs("div", { className: "flex gap-2", children: [_jsx("button", { disabled: actionBusy === trip.id, onClick: () => void completeTrip(trip.id), className: "border border-mono-1000 px-2 py-1 text-xs disabled:opacity-60 dark:border-mono-0", children: actionBusy === trip.id ? "Processing..." : "Complete" }), _jsx("button", { disabled: actionBusy === trip.id, onClick: () => void cancelTrip(trip.id), className: "border border-mono-1000 px-2 py-1 text-xs disabled:opacity-60 dark:border-mono-0", children: actionBusy === trip.id ? "Processing..." : "Cancel" })] }))] })] }, trip.id))) })] }) }), canCreateTrips(user?.role) && (_jsxs("form", { onSubmit: handleSubmit(submit), className: "grid gap-3 border border-mono-300 p-4 dark:border-mono-700 md:grid-cols-2", children: [_jsx("input", { className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", placeholder: "Source", ...register("source", { required: true }) }), _jsx("input", { className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", placeholder: "Destination", ...register("destination", { required: true }) }), _jsxs("select", { className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", ...register("vehicleId", { valueAsNumber: true, required: true }), children: [_jsx("option", { value: "", children: "Select available vehicle" }), vehicles.map((v) => (_jsxs("option", { value: v.id, children: [v.registration_number, " (", v.max_load_capacity, " kg)"] }, v.id)))] }), _jsxs("select", { className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", ...register("driverId", { valueAsNumber: true, required: true }), children: [_jsx("option", { value: "", children: "Select eligible driver" }), drivers.map((d) => (_jsx("option", { value: d.id, children: d.name }, d.id)))] }), _jsx("input", { type: "number", className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", placeholder: "Cargo Weight", ...register("cargoWeight", { valueAsNumber: true, required: true }) }), _jsx("input", { type: "number", className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", placeholder: "Planned Distance", ...register("plannedDistance", { valueAsNumber: true, required: true }) }), _jsx("input", { type: "number", className: "border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900", placeholder: "Revenue", ...register("revenue", { valueAsNumber: true }) }), _jsx("button", { disabled: formState.isSubmitting || Boolean(overweight), className: "border border-mono-1000 px-3 py-2 disabled:opacity-60 dark:border-mono-0", type: "submit", children: formState.isSubmitting ? "Saving..." : "Create Draft Trip" }), overweight && (_jsx("p", { className: "md:col-span-2 text-xs uppercase tracking-wide", children: "Cargo exceeds selected vehicle capacity" }))] })), message && _jsx("p", { className: "border border-mono-400 p-2 text-sm", children: message })] }));
}
