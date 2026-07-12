import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "../services/api";
import type { Driver } from "../types/app";
import { useAuth } from "../context/AuthContext";
import { canManageDrivers } from "../lib/roles";

type FormValues = {
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string;
  contactNumber: string;
  safetyScore: number;
  status: "available" | "on_trip" | "off_duty" | "suspended";
  suspended: boolean;
  email: string;
};

export default function DriversPage(): JSX.Element {
  const { user } = useAuth();
  const [items, setItems] = useState<Driver[]>([]);
  const [message, setMessage] = useState("");

  const { register, handleSubmit, reset, formState } = useForm<FormValues>({
    defaultValues: { status: "available", suspended: false, safetyScore: 80 },
  });

  const load = async () => {
    const response = await api.get<{ data: Driver[] }>("/drivers");
    setItems(response.data.data);
  };

  useEffect(() => {
    void load();
  }, []);

  const onSubmit = async (values: FormValues) => {
    setMessage("");
    try {
      await api.post("/drivers", values);
      setMessage("Driver created");
      reset({ status: "available", suspended: false, safetyScore: 80 } as any);
      await load();
    } catch (e: any) {
      setMessage(e?.response?.data?.message || "Could not create driver");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold uppercase tracking-wide">Driver Management</h1>

      <div className="overflow-x-auto border border-mono-300 dark:border-mono-700">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-mono-300 dark:border-mono-700">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">License Number</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Expiry Date</th>
              <th className="px-3 py-2">Contact</th>
              <th className="px-3 py-2">Safety Score</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">License State</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-mono-200 dark:border-mono-800">
                <td className="px-3 py-2">{item.name}</td>
                <td className="px-3 py-2">{item.license_number}</td>
                <td className="px-3 py-2">{item.license_category}</td>
                <td className="px-3 py-2">{item.license_expiry_date?.slice(0, 10)}</td>
                <td className="px-3 py-2">{item.contact_number}</td>
                <td className="px-3 py-2">{item.safety_score}</td>
                <td className="px-3 py-2 uppercase tracking-wide">{item.status}</td>
                <td className="px-3 py-2 font-semibold uppercase tracking-wide">{item.license_status_label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canManageDrivers(user?.role) && (
        <form className="grid gap-3 border border-mono-300 p-4 dark:border-mono-700 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <input className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" placeholder="Name" {...register("name", { required: true })} />
          <input className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" placeholder="License Number" {...register("licenseNumber", { required: true })} />
          <input className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" placeholder="License Category" {...register("licenseCategory", { required: true })} />
          <input type="date" className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" {...register("licenseExpiryDate", { required: true })} />
          <input className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" placeholder="Contact Number" {...register("contactNumber", { required: true })} />
          <input className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" placeholder="Email" {...register("email")} />
          <input type="number" className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" placeholder="Safety Score" {...register("safetyScore", { valueAsNumber: true, required: true })} />
          <select className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" {...register("status", { required: true })}>
            <option value="available">available</option>
            <option value="on_trip">on_trip</option>
            <option value="off_duty">off_duty</option>
            <option value="suspended">suspended</option>
          </select>
          <label className="flex items-center gap-2 border border-mono-400 px-3 py-2 dark:border-mono-700">
            <input type="checkbox" {...register("suspended")} />
            Suspended
          </label>
          <button disabled={formState.isSubmitting} className="border border-mono-1000 px-3 py-2 dark:border-mono-0" type="submit">
            {formState.isSubmitting ? "Saving..." : "Add Driver"}
          </button>
        </form>
      )}

      {message && <p className="border border-mono-400 p-2 text-sm">{message}</p>}
    </div>
  );
}
