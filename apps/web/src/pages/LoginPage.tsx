import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const schema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setError("");
    try {
      await login(values.email, values.password);
      navigate("/dashboard");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-mono-50 p-4 text-mono-1000">
      <form
        className="w-full max-w-md border border-mono-300 bg-mono-0 p-8 dark:border-mono-700 dark:bg-mono-1000 dark:text-mono-0"
        onSubmit={handleSubmit(onSubmit)}
      >
        <h1 className="text-2xl font-semibold uppercase tracking-wide">TransitOps Login</h1>
        <p className="mt-2 text-sm text-mono-700 dark:text-mono-300">
          Sign in with your enterprise credentials.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide">Email</label>
            <input
              className="w-full border border-mono-400 px-3 py-2 outline-none focus:border-mono-1000 dark:border-mono-600 dark:bg-mono-900 dark:focus:border-mono-0"
              {...register("email")}
            />
            {errors.email && <p className="mt-1 text-xs">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide">Password</label>
            <input
              type="password"
              className="w-full border border-mono-400 px-3 py-2 outline-none focus:border-mono-1000 dark:border-mono-600 dark:bg-mono-900 dark:focus:border-mono-0"
              {...register("password")}
            />
            {errors.password && <p className="mt-1 text-xs">{errors.password.message}</p>}
          </div>
        </div>

        {error && <p className="mt-4 border border-mono-400 p-2 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 w-full border border-mono-1000 bg-mono-1000 px-4 py-2 text-mono-0 disabled:opacity-60 dark:border-mono-0 dark:bg-mono-0 dark:text-mono-1000"
        >
          {isSubmitting ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
