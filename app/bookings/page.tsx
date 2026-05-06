"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

type BookingRow = {
  id: string;
  client_id: string;
  event_type: string | null;
  event_date: string | null;
  location: string | null;
  total_amount: number | null;
  advance_amount: number | null;
  balance_amount: number | null;
  booking_status: string;
  created_at: string;
};

type ClientRow = {
  id: string;
  name: string;
};

type BookingDisplay = BookingRow & {
  client_name: string;
};

export default function BookingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingDisplay[]>([]);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("*")
        .eq("artist_id", user.id)
        .order("created_at", { ascending: false });

      const { data: clientsData } = await supabase
        .from("clients")
        .select("id, name")
        .eq("artist_id", user.id);

      const clientMap = new Map(
        (clientsData || []).map((c: ClientRow) => [c.id, c.name])
      );

      const merged: BookingDisplay[] = (bookingsData || []).map(
        (b: BookingRow) => ({
          ...b,
          client_name: clientMap.get(b.client_id) || "Unknown Client",
        })
      );

      setBookings(merged);
      setLoading(false);
    };

    init();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-pink-50 flex items-center justify-center">
        <p className="text-gray-600 text-lg">Loading bookings...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-pink-900">
              Confirmed Bookings
            </h1>

            <p className="text-gray-600 mt-1">
              Manage events, payments & bridal schedules
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="px-5 py-2 rounded-xl bg-white border border-pink-200 hover:bg-pink-50 transition"
            >
              Dashboard
            </Link>

            <Link
              href="/quotations"
              className="px-5 py-2 rounded-xl bg-pink-800 text-white hover:bg-pink-900 transition"
            >
              Quotations
            </Link>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg p-10 text-center">
            <h2 className="text-2xl font-semibold text-pink-900">
              No bookings yet
            </h2>

            <p className="text-gray-500 mt-2">
              Converted quotations will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {bookings.map((b) => {
              const isFullyPaid =
                Number(b.balance_amount || 0) <= 0;

              return (
                <Link
                  key={b.id}
                  href={`/bookings/${b.id}`}
                  className="block"
                >
                  <div className="bg-white rounded-3xl shadow-md hover:shadow-2xl transition duration-300 border border-pink-100 hover:border-pink-300 p-6">

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h2 className="text-2xl font-bold text-pink-900">
                            {b.client_name}
                          </h2>

                          <span
                            className={`text-xs px-3 py-1 rounded-full font-medium ${
                              isFullyPaid
                                ? "bg-green-100 text-green-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {isFullyPaid ? "Fully Paid" : "Pending"}
                          </span>
                        </div>

                        <p className="text-gray-700 font-medium">
                          {b.event_type || "Event"}
                        </p>

                        <div className="flex flex-col md:flex-row gap-2 md:gap-6 text-sm text-gray-500">
                          <p>
                            📅 {b.event_date || "No date"}
                          </p>

                          <p>
                            📍 {b.location || "Location not added"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 md:gap-8">

                        <div className="text-center">
                          <p className="text-xs uppercase tracking-wide text-gray-400">
                            Total
                          </p>

                          <h3 className="text-xl font-bold text-gray-900">
                            ₹{Number(b.total_amount || 0).toLocaleString()}
                          </h3>
                        </div>

                        <div className="text-center">
                          <p className="text-xs uppercase tracking-wide text-gray-400">
                            Advance
                          </p>

                          <h3 className="text-xl font-bold text-pink-700">
                            ₹{Number(b.advance_amount || 0).toLocaleString()}
                          </h3>
                        </div>

                        <div className="text-center">
                          <p className="text-xs uppercase tracking-wide text-gray-400">
                            Balance
                          </p>

                          <h3
                            className={`text-xl font-bold ${
                              isFullyPaid
                                ? "text-green-600"
                                : "text-red-500"
                            }`}
                          >
                            ₹{Number(b.balance_amount || 0).toLocaleString()}
                          </h3>
                        </div>

                      </div>

                    </div>

                  </div>
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </main>
  );
}