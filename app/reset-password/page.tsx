"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/login?passwordUpdated=true");
  };

  return (
    <main className="min-h-screen bg-[#fff7f8] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-pink-100">
        <h1 className="text-2xl font-semibold text-gray-900 text-center">
          Create New Password
        </h1>

        <p className="mt-2 text-sm text-gray-600 text-center">
          Enter your new password below.
        </p>

        <form onSubmit={handleUpdatePassword} className="mt-6 space-y-4">
          <input
            type="password"
            required
            placeholder="New password"
            className="w-full rounded-2xl border border-pink-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            type="password"
            required
            placeholder="Confirm new password"
            className="w-full rounded-2xl border border-pink-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {error && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-pink-600 py-3 font-medium text-white disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </main>
  );
}