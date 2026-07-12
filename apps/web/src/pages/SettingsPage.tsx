import { useEffect, useState } from "react";
import { api } from "../services/api";

type NotificationItem = {
  id: number;
  message: string;
  created_at: string;
  read_at: string | null;
};

export default function SettingsPage(): JSX.Element {
  const [items, setItems] = useState<NotificationItem[]>([]);

  const load = async () => {
    const response = await api.get<NotificationItem[]>("/notifications");
    setItems(response.data);
  };

  useEffect(() => {
    void load();
  }, []);

  const markRead = async (id: number) => {
    await api.post(`/notifications/${id}/read`);
    await load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold uppercase tracking-wide">Settings and Notifications</h1>

      <section className="border border-mono-300 p-4 dark:border-mono-700">
        <h2 className="mb-3 text-sm uppercase tracking-wide">License and Safety Alerts</h2>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col gap-2 border border-mono-200 p-3 text-sm dark:border-mono-800 md:flex-row md:items-center md:justify-between">
              <div>
                <p>{item.message}</p>
                <p className="text-xs uppercase tracking-wide">{item.created_at?.slice(0, 19).replace("T", " ")}</p>
              </div>
              {!item.read_at && (
                <button className="border border-mono-1000 px-2 py-1 dark:border-mono-0" onClick={() => void markRead(item.id)}>
                  Mark Read
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
