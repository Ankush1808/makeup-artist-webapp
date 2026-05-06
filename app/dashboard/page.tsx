"use client";

import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-pink-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <section className="rounded-[2rem] bg-white shadow-xl border border-pink-100 p-6 md:p-10">
          <p className="text-sm uppercase tracking-[0.25em] text-pink-500 font-semibold">
            Bridal Business Assistant
          </p>

          <h1 className="mt-3 text-4xl md:text-5xl font-bold text-pink-950 leading-tight">
            Welcome back ✨
          </h1>

          <p className="mt-3 text-gray-600 text-lg max-w-2xl">
            Create luxury quotations, convert them into confirmed events and
            track your payments beautifully.
          </p>

          <Link
            href="/quotations/new"
            className="mt-8 inline-flex w-full md:w-auto justify-center rounded-2xl bg-pink-900 px-8 py-4 text-white font-semibold shadow-lg hover:bg-pink-950 transition"
          >
            + Create New Quote
          </Link>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-pink-950 mb-4">
            Quick Actions
          </h2>

          <div className="grid md:grid-cols-4 gap-4">
            <Link
              href="/quotations/new"
              className="rounded-3xl bg-white p-6 shadow-md border border-pink-100 hover:shadow-xl transition"
            >
              <div className="text-3xl mb-4">📄</div>
              <h3 className="font-bold text-pink-950">New Bridal Quote</h3>
              <p className="text-sm text-gray-500 mt-2">
                Start a fresh quotation for a bride or event.
              </p>
            </Link>

            <Link
              href="/quotations"
              className="rounded-3xl bg-white p-6 shadow-md border border-pink-100 hover:shadow-xl transition"
            >
              <div className="text-3xl mb-4">✨</div>
              <h3 className="font-bold text-pink-950">Client Quotes</h3>
              <p className="text-sm text-gray-500 mt-2">
                View, download and convert quotations.
              </p>
            </Link>

            <Link
              href="/bookings"
              className="rounded-3xl bg-white p-6 shadow-md border border-pink-100 hover:shadow-xl transition"
            >
              <div className="text-3xl mb-4">💍</div>
              <h3 className="font-bold text-pink-950">Confirmed Events</h3>
              <p className="text-sm text-gray-500 mt-2">
                Manage bookings, dates and event details.
              </p>
            </Link>

            <Link
              href="/bookings"
              className="rounded-3xl bg-white p-6 shadow-md border border-pink-100 hover:shadow-xl transition"
            >
              <div className="text-3xl mb-4">💰</div>
              <h3 className="font-bold text-pink-950">Collections</h3>
              <p className="text-sm text-gray-500 mt-2">
                Track advance, balance and payment status.
              </p>
            </Link>
          </div>
        </section>

        <section className="rounded-3xl bg-pink-900 text-white p-6 md:p-8 shadow-xl">
          <h2 className="text-2xl font-bold">Your workflow</h2>

          <div className="mt-5 grid md:grid-cols-5 gap-3 text-sm">
            {["Lead", "Quote", "Booking", "Payment", "Fully Paid"].map(
              (step, index) => (
                <div key={step} className="rounded-2xl bg-white/10 p-4 text-center">
                  <p className="text-pink-100">Step {index + 1}</p>
                  <p className="font-semibold mt-1">{step}</p>
                </div>
              )
            )}
          </div>
        </section>
      </div>
    </main>
  );
}