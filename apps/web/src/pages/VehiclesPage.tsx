import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "../services/api";
import type { Vehicle } from "../types/app";
import { useAuth } from "../context/AuthContext";
import { canManageVehicles } from "../lib/roles";

type FormValues = {
  registrationNumber: string;
  model: string;
  type: string;
  maxLoadCapacity: number;
  odometer: number;
  acquisitionCost: number;
  region: string;
  status: "available" | "on_trip" | "in_shop" | "retired";
};

export default function VehiclesPage(): JSX.Element {
  const { user } = useAuth();
  const [items, setItems] = useState<Vehicle[]>([]);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  const { register, handleSubmit, reset, formState } = useForm<FormValues>({
    defaultValues: { status: "available" },
  });

  const load = async () => {
    const response = await api.get<{ data: Vehicle[] }>("/vehicles", {
      params: { search },
    });
    setItems(response.data.data);
  };

  useEffect(() => {
    void load();
  }, []);

  const onSubmit = async (values: FormValues) => {
    setMessage("");
    try {
      await api.post("/vehicles", values);
      setMessage("Vehicle created");
      reset({ status: "available" } as any);
      await load();
    } catch (e: any) {
      setMessage(e?.response?.data?.message || "Could not create vehicle");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold uppercase tracking-wide">Vehicle Registry</h1>

      <div className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by registration or model"
          className="w-full border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900"
        />
        <button
          className="border border-mono-1000 px-3 py-2 dark:border-mono-0"
          onClick={() => void load()}
        >
          Search
        </button>
      </div>

      <div className="overflow-x-auto border border-mono-300 dark:border-mono-700">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-mono-300 dark:border-mono-700">
            <tr>
              <th className="px-3 py-2">Registration</th>
              <th className="px-3 py-2">Model</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Load Capacity</th>
              <th className="px-3 py-2">Odometer</th>
              <th className="px-3 py-2">Cost</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-mono-200 dark:border-mono-800">
                <td className="px-3 py-2">{item.registration_number}</td>
                <td className="px-3 py-2">{item.model}</td>
                <td className="px-3 py-2">{item.type}</td>
                <td className="px-3 py-2">{item.max_load_capacity}</td>
                <td className="px-3 py-2">{item.odometer}</td>
                <td className="px-3 py-2">{item.acquisition_cost}</td>
                <td className="px-3 py-2 uppercase tracking-wide">{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canManageVehicles(user?.role) && (
        <form className="grid gap-3 border border-mono-300 p-4 dark:border-mono-700 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <input className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" placeholder="Registration Number" {...register("registrationNumber", { required: true })} />
          <input className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" placeholder="Model" {...register("model", { required: true })} />
          <input className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" placeholder="Type" {...register("type", { required: true })} />
          <input type="number" className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" placeholder="Max Load Capacity" {...register("maxLoadCapacity", { valueAsNumber: true, required: true })} />
          <input type="number" className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" placeholder="Odometer" {...register("odometer", { valueAsNumber: true, required: true })} />
          <input type="number" className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" placeholder="Acquisition Cost" {...register("acquisitionCost", { valueAsNumber: true, required: true })} />
          <input className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" placeholder="Region (optional)" {...register("region")} />
          <select className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" {...register("status", { required: true })}>
            <option value="available">available</option>
            <option value="on_trip">on_trip</option>
            <option value="in_shop">in_shop</option>
            <option value="retired">retired</option>
          </select>
          <button disabled={formState.isSubmitting} className="border border-mono-1000 px-3 py-2 dark:border-mono-0" type="submit">
            {formState.isSubmitting ? "Saving..." : "Add Vehicle"}
          </button>
        </form>
      )}

      {message && <p className="border border-mono-400 p-2 text-sm">{message}</p>}
    </div>
  );
}
