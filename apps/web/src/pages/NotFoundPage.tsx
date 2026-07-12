import { Link } from "react-router-dom";

export default function NotFoundPage(): JSX.Element {
  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold uppercase tracking-wide">Page not found</h1>
      <p className="mt-2 text-sm">The page you requested does not exist.</p>
      <Link className="mt-4 inline-block border border-mono-1000 px-3 py-2 dark:border-mono-0" to="/dashboard">
        Go to dashboard
      </Link>
    </div>
  );
}
