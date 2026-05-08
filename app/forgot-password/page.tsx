"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const redirectTo = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Password reset link sent. Please check your email.");
      setEmail("");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#fff7f8] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-pink-100">
        <h1 className="text-2xl font-semibold text-gray-900 text-center">
          Forgot Password
        </h1>

        <p className="mt-2 text-sm text-gray-600 text-center">
          Enter your registered email and we will send you a password reset link.
        </p>

        <form onSubmit={handleReset} className="mt-6 space-y-4">
          <input
            type="email"
            required
            placeholder="Enter your email"
            className="w-full rounded-2xl border border-pink-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {message && (
            <p className="rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">
              {message}
            </p>
          )}

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
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <Link
          href="/login"
          className="mt-5 block text-center text-sm text-pink-600"
        >
          Back to Login
        </Link>
      </div>
    </main>
  );
}