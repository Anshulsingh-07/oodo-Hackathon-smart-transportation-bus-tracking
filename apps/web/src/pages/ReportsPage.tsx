import { useEffect, useState } from "react";
import { api } from "../services/api";

type Report = {
  fuelEfficiency: number;
  fleetUtilization: number;
  totalOperationalCost: number;
  vehicleRoi: Array<{ id: number; registration_number: string; roi: number }>;
};

export default function ReportsPage(): JSX.Element {
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await api.get<Report>("/reports/summary");
      setReport(response.data);
    };

    void load();
  }, []);

  if (!report) {
    return <p className="text-sm">Loading reports...</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold uppercase tracking-wide">Reports</h1>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="border border-mono-300 p-4 dark:border-mono-700">
          <p className="text-xs uppercase tracking-wide">Fuel Efficiency</p>
          <p className="mt-2 text-2xl font-semibold">{report.fuelEfficiency.toFixed(2)}</p>
        </div>
        <div className="border border-mono-300 p-4 dark:border-mono-700">
          <p className="text-xs uppercase tracking-wide">Fleet Utilization</p>
          <p className="mt-2 text-2xl font-semibold">{report.fleetUtilization.toFixed(2)}%</p>
        </div>
        <div className="border border-mono-300 p-4 dark:border-mono-700">
          <p className="text-xs uppercase tracking-wide">Total Operational Cost</p>
          <p className="mt-2 text-2xl font-semibold">{report.totalOperationalCost.toFixed(2)}</p>
        </div>
      </div>

      <div className="overflow-x-auto border border-mono-300 dark:border-mono-700">
        <table className="min-w-full text-sm">
          <thead className="border-b border-mono-300 dark:border-mono-700">
            <tr>
              <th className="px-3 py-2 text-left">Vehicle</th>
              <th className="px-3 py-2 text-left">ROI</th>
            </tr>
          </thead>
          <tbody>
            {report.vehicleRoi.map((row) => (
              <tr key={row.id} className="border-b border-mono-200 dark:border-mono-800">
                <td className="px-3 py-2">{row.registration_number}</td>
                <td className="px-3 py-2">{Number(row.roi || 0).toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <a
        href={`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/reports/summary.csv`}
        target="_blank"
        rel="noreferrer"
        className="inline-block border border-mono-1000 px-3 py-2 dark:border-mono-0"
      >
        Export CSV
      </a>
    </div>
  );
}
