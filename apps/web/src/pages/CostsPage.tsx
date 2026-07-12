import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "../services/api";
import { canLogExpenses, canLogFuel } from "../lib/roles";
import { useAuth } from "../context/AuthContext";

type Vehicle = { id: number; registration_number: string };

type CostData = {
  fuel: Array<{ id: number; registration_number: string; liters: number; cost: number; log_date: string }>;
  expenses: Array<{ id: number; registration_number: string; category: string; amount: number; expense_date: string }>;
};

export default function CostsPage(): JSX.Element {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [data, setData] = useState<CostData>({ fuel: [], expenses: [] });

  const fuelForm = useForm();
  const expenseForm = useForm();

  const load = async () => {
    const [costRes, vehicleRes] = await Promise.all([
      api.get<CostData>("/costs"),
      api.get<{ data: Vehicle[] }>("/vehicles"),
    ]);
    setData(costRes.data);
    setVehicles(vehicleRes.data.data.map((v) => ({ id: v.id, registration_number: (v as any).registration_number })));
  };

  useEffect(() => {
    void load();
  }, []);

  const submitFuel = fuelForm.handleSubmit(async (values: any) => {
    setMessage("");
    try {
      await api.post("/costs/fuel", values);
      setMessage("Fuel log added");
      fuelForm.reset();
      await load();
    } catch (e: any) {
      setMessage(e?.response?.data?.message || "Fuel log failed");
    }
  });

  const submitExpense = expenseForm.handleSubmit(async (values: any) => {
    setMessage("");
    try {
      await api.post("/costs/expenses", values);
      setMessage("Expense log added");
      expenseForm.reset();
      await load();
    } catch (e: any) {
      setMessage(e?.response?.data?.message || "Expense log failed");
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold uppercase tracking-wide">Fuel and Expenses</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border border-mono-300 p-4 dark:border-mono-700">
          <h2 className="mb-3 text-sm uppercase tracking-wide">Fuel Logs</h2>
          <div className="space-y-2 text-sm">
            {data.fuel.map((f) => (
              <p key={f.id}>{f.registration_number} | {f.liters} L | {f.cost} | {f.log_date?.slice(0, 10)}</p>
            ))}
          </div>
          {canLogFuel(user?.role) && (
            <form onSubmit={submitFuel} className="mt-4 grid gap-2">
              <select className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" {...fuelForm.register("vehicleId", { required: true })}>
                <option value="">Vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.registration_number}</option>
                ))}
              </select>
              <input type="date" className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" {...fuelForm.register("logDate", { required: true })} />
              <input type="number" className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" placeholder="Liters" {...fuelForm.register("liters", { required: true })} />
              <input type="number" className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" placeholder="Cost" {...fuelForm.register("cost", { required: true })} />
              <button className="border border-mono-1000 px-3 py-2 dark:border-mono-0" type="submit">Add Fuel Log</button>
            </form>
          )}
        </div>

        <div className="border border-mono-300 p-4 dark:border-mono-700">
          <h2 className="mb-3 text-sm uppercase tracking-wide">Expenses</h2>
          <div className="space-y-2 text-sm">
            {data.expenses.map((f) => (
              <p key={f.id}>{f.registration_number} | {f.category} | {f.amount} | {f.expense_date?.slice(0, 10)}</p>
            ))}
          </div>
          {canLogExpenses(user?.role) && (
            <form onSubmit={submitExpense} className="mt-4 grid gap-2">
              <select className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" {...expenseForm.register("vehicleId", { required: true })}>
                <option value="">Vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.registration_number}</option>
                ))}
              </select>
              <select className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" {...expenseForm.register("category", { required: true })}>
                <option value="">Category</option>
                <option value="toll">toll</option>
                <option value="maintenance">maintenance</option>
                <option value="fine">fine</option>
                <option value="insurance">insurance</option>
                <option value="other">other</option>
              </select>
              <input type="date" className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" {...expenseForm.register("expenseDate", { required: true })} />
              <input type="number" className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" placeholder="Amount" {...expenseForm.register("amount", { required: true })} />
              <input className="border border-mono-400 px-3 py-2 dark:border-mono-700 dark:bg-mono-900" placeholder="Notes" {...expenseForm.register("notes")} />
              <button className="border border-mono-1000 px-3 py-2 dark:border-mono-0" type="submit">Add Expense</button>
            </form>
          )}
        </div>
      </div>

      {message && <p className="border border-mono-400 p-2 text-sm">{message}</p>}
    </div>
  );
}
