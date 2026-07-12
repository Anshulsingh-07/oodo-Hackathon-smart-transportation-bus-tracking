import { Link, NavLink, Outlet } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

type NotificationItem = {
  id: number;
  message: string;
  read_at: string | null;
};

const links = [
  ["Dashboard", "/dashboard"],
  ["Vehicles", "/vehicles"],
  ["Drivers", "/drivers"],
  ["Trips", "/trips"],
  ["Maintenance", "/maintenance"],
  ["Fuel and Expenses", "/costs"],
  ["Reports", "/reports"],
  ["Settings", "/settings"],
] as const;

export default function AppLayout(): JSX.Element {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    const load = async () => {
      const response = await api.get<NotificationItem[]>("/notifications");
      setNotifications(response.data);
    };

    void load();
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read_at).length,
    [notifications],
  );

  return (
    <div className="min-h-screen bg-mono-0 text-mono-1000 dark:bg-mono-1000 dark:text-mono-0">
      <div className="mx-auto flex max-w-[1400px] flex-col md:flex-row">
        <aside className="w-full border-b border-mono-200 p-4 md:min-h-screen md:w-64 md:border-b-0 md:border-r dark:border-mono-700">
          <h1 className="text-xl font-semibold tracking-wide">TransitOps</h1>
          <nav className="mt-6 space-y-2 text-sm uppercase tracking-wide">
            {links.map(([label, href]) => (
              <NavLink
                key={href}
                to={href}
                className={({ isActive }) =>
                  `block border px-3 py-2 ${
                    isActive
                      ? "border-mono-1000 bg-mono-1000 text-mono-0 dark:border-mono-0 dark:bg-mono-0 dark:text-mono-1000"
                      : "border-mono-300 hover:border-mono-1000 dark:border-mono-700 dark:hover:border-mono-0"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1">
          <header className="flex flex-col gap-3 border-b border-mono-200 px-4 py-4 md:flex-row md:items-center md:justify-between dark:border-mono-700">
            <div className="text-sm">
              Logged in as <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Link to="/settings" className="border border-mono-400 px-3 py-1 dark:border-mono-600">
                Notifications ({unreadCount})
              </Link>
              <label className="flex items-center gap-2 border border-mono-400 px-3 py-1 dark:border-mono-600">
                <span>Dark mode</span>
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={(e) => setDarkMode(e.target.checked)}
                />
              </label>
              <button
                type="button"
                className="border border-mono-1000 px-3 py-1 font-medium dark:border-mono-0"
                onClick={() => void logout()}
              >
                Logout
              </button>
            </div>
          </header>
          <div className="p-4 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
