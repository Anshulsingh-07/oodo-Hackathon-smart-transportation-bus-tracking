import { useEffect, useState } from "react";
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { api } from "../services/api";

type DashboardData = {
  kpis: {
    activeVehicles: number;
    availableVehicles: number;
    inMaintenance: number;
    activeTrips: number;
    draftTrips: number;
    onDutyDrivers: number;
    utilization: number;
  };
  charts: {
    tripStatusDistribution: Array<{ status: string; count: number }>;
    costBreakdown: Array<{ bucket: string; amount: number }>;
  };
};

export default function DashboardPage(): JSX.Element {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const load = async () => {
      const res = await api.get<DashboardData>("/dashboard");
      setData(res.data);
    };
    void load();
  }, []);

  if (!data) {
    return <p className="text-sm">Loading dashboard...</p>;
  }

  const cards = [
    ["Active Vehicles", data.kpis.activeVehicles],
    ["Available Vehicles", data.kpis.availableVehicles],
    ["Vehicles In Maintenance", data.kpis.inMaintenance],
    ["Active Trips", data.kpis.activeTrips],
    ["Draft Trips", data.kpis.draftTrips],
    ["Drivers On Duty", data.kpis.onDutyDrivers],
    ["Fleet Utilization (%)", data.kpis.utilization],
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <article key={label} className="border border-mono-300 p-4 dark:border-mono-700">
            <p className="text-xs uppercase tracking-wider">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </article>
        ))}
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 border border-mono-300 p-4 dark:border-mono-700">
          <h2 className="mb-3 text-sm uppercase tracking-wide">Trip Status Distribution</h2>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={data.charts.tripStatusDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d9d9d9" />
              <XAxis dataKey="status" stroke="#111" />
              <YAxis stroke="#111" />
              <Tooltip />
              <Bar dataKey="count" fill="#111" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="h-72 border border-mono-300 p-4 dark:border-mono-700">
          <h2 className="mb-3 text-sm uppercase tracking-wide">Cost Breakdown</h2>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={data.charts.costBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d9d9d9" />
              <XAxis dataKey="bucket" stroke="#111" />
              <YAxis stroke="#111" />
              <Tooltip />
              <Bar dataKey="amount" fill="#555" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
