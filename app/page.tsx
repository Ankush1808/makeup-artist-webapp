import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-pink-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl rounded-3xl bg-white p-10 shadow-xl">
        <h1 className="text-4xl font-bold text-gray-900">
          Makeup Artist Web App
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Your new web app setup is working successfully.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/signup"
            className="rounded-xl bg-pink-600 px-5 py-3 text-white font-semibold hover:bg-pink-700"
          >
            Go to Signup
          </Link>

          <Link
            href="/login"
            className="rounded-xl border border-pink-300 px-5 py-3 font-semibold text-pink-700 hover:bg-pink-50"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </main>
  );
}