import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "../services/api";
import type { Vehicle } from "../types/app";
import { useAuth } from "../context/AuthContext";
import { canManageMaintenance } from "../lib/roles";

type MaintenanceRecord = {
  id: number;
  registration_number: string;
  maintenance_type: string;
  cost: number;
  status: "open" | "closed";
};

type FormValues = {
  vehicleId: number;
  maintenanceType: string;
  description: string;
  cost: number;
};

export default function MaintenancePage(): JSX.Element {
  const { user } = useAuth();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [message, setMessage] = useState("");

  const { register, handleSubmit, reset, formState } = useForm<FormValues>();

  const load = async () => {
    const [maintRes, vehRes] = await Promise.all([
      api.get<MaintenanceRecord[]>("/maintenance"),
      api.get<Vehicle[]>("/vehicles/assignable"),
    ]);
    setRecords(maintRes.data);
    setVehicles(vehRes.data);
  };

  useEffect(() => {
    void load();
  }, []);

  const onSubmit = async (values: FormValues) => {
    setMessage("");
    try {
      await api.post("/maintenance", values);
      setMessage("Maintenance opened and vehicle moved to in shop");
      reset();
      await load();
    } catch (e: any) {
      setMessage(e?.response?.data?.message || "Could not create maintenance");
    }
  };

  const closeRecord = async (id: number) => {
    setMessage("");
    try {
      await api.post(`/maintenance/${id}/close`);
      setMessage("Maintenance closed");
      await load();
    } catch (e: any) {
      setMessage(e?.response?.data?.message || "Could not close maintenance");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold uppercase tracking-wide">Maintenance</h1>

      <div className="overflow-x-auto border border-mono-300 dark:border-mono-700">
        <table className="min-w-full text-sm">
          <thead className="border-b border-mono-300 dark:border-mono-700">
            <tr>
              <th className="px-3 py-2 text-left">Vehicle</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Cost</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {records.map((item) => (
              <tr key={item.id} className="border-b border-mono-200 dark:border-mono-800">
                <td className="px-3 py-2">{item.registration_number}</td>
                <td className="px-3 py-2">{item.maintenance_type}</td>
                <td className="px-3 py-2">{item.cost}</td>
                <td className="px-3 py-2 uppercase tracking-wide">{item.status}</td>
                <td className="px-3 py-2">
                  {canManageMaintenance(user?.role) && item.status === "open" && (
                    <button className="border border-mono-1000 px-2 py-1 dark:border-mono-0" onClick={() => void closeRecord(item.id)}>
                      Close
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canManageMaintenance(user?.role) && (
        <form className="grid gap-3 border border-mono-300 p-4 dark:border-mono-700 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <select className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" {...register("vehicleId", { valueAsNumber: true, required: true })}>
            <option value="">Select vehicle</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>{vehicle.registration_number}</option>
            ))}
          </select>
          <input className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" placeholder="Maintenance Type" {...register("maintenanceType", { required: true })} />
          <input className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" placeholder="Description" {...register("description", { required: true })} />
          <input type="number" className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" placeholder="Cost" {...register("cost", { valueAsNumber: true, required: true })} />
          <button type="submit" disabled={formState.isSubmitting} className="border border-mono-1000 px-3 py-2 dark:border-mono-0">
            {formState.isSubmitting ? "Saving..." : "Create Open Maintenance"}
          </button>
        </form>
      )}

      {message && <p className="border border-mono-400 p-2 text-sm">{message}</p>}
    </div>
  );
}
