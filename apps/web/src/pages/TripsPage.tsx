import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "../services/api";
import type { Driver, Trip, Vehicle } from "../types/app";
import { useAuth } from "../context/AuthContext";
import { canCreateTrips } from "../lib/roles";

type TripFormValues = {
  source: string;
  destination: string;
  vehicleId: number;
  driverId: number;
  cargoWeight: number;
  plannedDistance: number;
  revenue: number;
};

export default function TripsPage(): JSX.Element {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [message, setMessage] = useState("");
  const [actionBusy, setActionBusy] = useState<number | null>(null);

  const { register, watch, handleSubmit, reset, formState } = useForm<TripFormValues>();
  const selectedVehicleId = Number(watch("vehicleId"));
  const cargoWeight = Number(watch("cargoWeight") || 0);
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const overweight = selectedVehicle && cargoWeight > Number(selectedVehicle.max_load_capacity);

  const load = async () => {
    const [tripRes, vehicleRes, driverRes] = await Promise.all([
      api.get<Trip[]>("/trips"),
      api.get<Vehicle[]>("/vehicles/assignable"),
      api.get<Driver[]>("/drivers/assignable"),
    ]);
    setTrips(tripRes.data);
    setVehicles(vehicleRes.data);
    setDrivers(driverRes.data);
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async (values: TripFormValues) => {
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
    } catch (e: any) {
      setMessage(e?.response?.data?.message || "Could not create trip");
    }
  };

  const dispatchTrip = async (id: number) => {
    setActionBusy(id);
    setMessage("");
    try {
      await api.post(`/trips/${id}/dispatch`);
      setMessage("Trip dispatched");
      await load();
    } catch (e: any) {
      setMessage(e?.response?.data?.message || "Dispatch failed");
    } finally {
      setActionBusy(null);
    }
  };

  const completeTrip = async (id: number) => {
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
    } catch (e: any) {
      setMessage(e?.response?.data?.message || "Complete failed");
    } finally {
      setActionBusy(null);
    }
  };

  const cancelTrip = async (id: number) => {
    setActionBusy(id);
    try {
      await api.post(`/trips/${id}/cancel`);
      setMessage("Trip cancelled");
      await load();
    } catch (e: any) {
      setMessage(e?.response?.data?.message || "Cancel failed");
    } finally {
      setActionBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold uppercase tracking-wide">Trip Management</h1>

      <div className="overflow-x-auto border border-mono-300 dark:border-mono-700">
        <table className="min-w-full text-sm">
          <thead className="border-b border-mono-300 dark:border-mono-700">
            <tr>
              <th className="px-3 py-2 text-left">Route</th>
              <th className="px-3 py-2 text-left">Vehicle</th>
              <th className="px-3 py-2 text-left">Driver</th>
              <th className="px-3 py-2 text-left">Cargo</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((trip) => (
              <tr key={trip.id} className="border-b border-mono-200 dark:border-mono-800">
                <td className="px-3 py-2">{trip.source} to {trip.destination}</td>
                <td className="px-3 py-2">{trip.registration_number}</td>
                <td className="px-3 py-2">{trip.driver_name}</td>
                <td className="px-3 py-2">{trip.cargo_weight}</td>
                <td className="px-3 py-2 uppercase tracking-wide">{trip.status}</td>
                <td className="px-3 py-2">
                  {canCreateTrips(user?.role) && trip.status === "draft" && (
                    <button
                      disabled={actionBusy === trip.id}
                      onClick={() => void dispatchTrip(trip.id)}
                      className="border border-mono-1000 px-2 py-1 text-xs disabled:opacity-60 dark:border-mono-0"
                    >
                      {actionBusy === trip.id ? "Processing..." : "Dispatch"}
                    </button>
                  )}
                  {canCreateTrips(user?.role) && trip.status === "dispatched" && (
                    <div className="flex gap-2">
                      <button
                        disabled={actionBusy === trip.id}
                        onClick={() => void completeTrip(trip.id)}
                        className="border border-mono-1000 px-2 py-1 text-xs disabled:opacity-60 dark:border-mono-0"
                      >
                        {actionBusy === trip.id ? "Processing..." : "Complete"}
                      </button>
                      <button
                        disabled={actionBusy === trip.id}
                        onClick={() => void cancelTrip(trip.id)}
                        className="border border-mono-1000 px-2 py-1 text-xs disabled:opacity-60 dark:border-mono-0"
                      >
                        {actionBusy === trip.id ? "Processing..." : "Cancel"}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canCreateTrips(user?.role) && (
        <form onSubmit={handleSubmit(submit)} className="grid gap-3 border border-mono-300 p-4 dark:border-mono-700 md:grid-cols-2">
          <input className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" placeholder="Source" {...register("source", { required: true })} />
          <input className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" placeholder="Destination" {...register("destination", { required: true })} />
          <select className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" {...register("vehicleId", { valueAsNumber: true, required: true })}>
            <option value="">Select available vehicle</option>
            {vehicles.map((v) => (
              <option value={v.id} key={v.id}>{v.registration_number} ({v.max_load_capacity} kg)</option>
            ))}
          </select>
          <select className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" {...register("driverId", { valueAsNumber: true, required: true })}>
            <option value="">Select eligible driver</option>
            {drivers.map((d) => (
              <option value={d.id} key={d.id}>{d.name}</option>
            ))}
          </select>
          <input type="number" className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" placeholder="Cargo Weight" {...register("cargoWeight", { valueAsNumber: true, required: true })} />
          <input type="number" className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" placeholder="Planned Distance" {...register("plannedDistance", { valueAsNumber: true, required: true })} />
          <input type="number" className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" placeholder="Revenue" {...register("revenue", { valueAsNumber: true })} />
          <button disabled={formState.isSubmitting || Boolean(overweight)} className="border border-mono-1000 px-3 py-2 disabled:opacity-60 dark:border-mono-0" type="submit">
            {formState.isSubmitting ? "Saving..." : "Create Draft Trip"}
          </button>
          {overweight && (
            <p className="md:col-span-2 text-xs uppercase tracking-wide">Cargo exceeds selected vehicle capacity</p>
          )}
        </form>
      )}

      {message && <p className="border border-mono-400 p-2 text-sm">{message}</p>}
    </div>
  );
}
