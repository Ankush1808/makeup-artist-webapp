"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

type QuotationRow = {
  id: string;
  quote_number: string;
  client_id: string;
  event_type: string | null;
  event_date: string | null;
  location: string | null;
  grand_total: number | null;
  status: string;
  created_at: string;
};

type ClientRow = {
  id: string;
  name: string;
};

type QuotationDisplay = QuotationRow & {
  client_name: string;
};

export default function QuotationsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [quotations, setQuotations] = useState<QuotationDisplay[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login");
          return;
        }

        const { data: quotationsData, error: quotationsError } = await supabase
          .from("quotations")
          .select("*")
          .eq("artist_id", user.id)
          .order("created_at", { ascending: false });

        if (quotationsError) {
          setMessage(`Could not load quotations: ${quotationsError.message}`);
          setLoading(false);
          return;
        }

        const { data: clientsData, error: clientsError } = await supabase
          .from("clients")
          .select("id, name")
          .eq("artist_id", user.id);

        if (clientsError) {
          setMessage(`Could not load clients: ${clientsError.message}`);
          setLoading(false);
          return;
        }

        const clientMap = new Map(
          (clientsData || []).map((client: ClientRow) => [
            client.id,
            client.name,
          ])
        );

        const merged: QuotationDisplay[] = (quotationsData || []).map(
          (quotation: QuotationRow) => ({
            ...quotation,
            client_name:
              clientMap.get(quotation.client_id) || "Unknown Client",
          })
        );

        setQuotations(merged);
      } catch {
        setMessage("Something went wrong while loading quotations.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  function getStatusColor(status: string) {
    const lower = status?.toLowerCase();

    if (lower?.includes("converted")) {
      return "bg-purple-100 text-purple-700";
    }

    if (lower?.includes("sent")) {
      return "bg-blue-100 text-blue-700";
    }

    return "bg-gray-100 text-gray-700";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-pink-50 flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading client quotes...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-pink-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        <section className="rounded-[2rem] bg-white shadow-xl border border-pink-100 p-6 md:p-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-pink-500 font-semibold">
                Quotation Management
              </p>

              <h1 className="mt-3 text-4xl md:text-5xl font-bold text-pink-950">
                Client Quotes
              </h1>

              <p className="mt-3 text-gray-600 text-lg max-w-2xl">
                Create, manage and convert bridal quotations beautifully.
              </p>
            </div>

            <Link
              href="/quotations/new"
              className="inline-flex items-center justify-center rounded-2xl bg-pink-900 px-6 py-4 text-white font-semibold shadow-lg hover:bg-pink-950 transition"
            >
              + Create New Quote
            </Link>
          </div>
        </section>

        {message && (
          <div className="rounded-2xl border border-pink-100 bg-pink-50 p-4 text-pink-700">
            {message}
          </div>
        )}

        {quotations.length === 0 ? (
          <section className="rounded-3xl bg-white border border-dashed border-pink-200 p-10 text-center shadow-md">
            <div className="text-5xl mb-4">📄</div>

            <h2 className="text-2xl font-bold text-pink-950">
              No quotations yet
            </h2>

            <p className="mt-3 text-gray-500">
              Start by creating your first bridal quotation.
            </p>

            <Link
              href="/quotations/new"
              className="mt-6 inline-flex rounded-2xl bg-pink-900 px-6 py-3 text-white font-semibold hover:bg-pink-950 transition"
            >
              Create First Quote
            </Link>
          </section>
        ) : (
          <div className="grid gap-5">
            {quotations.map((q) => (
              <Link
                key={q.id}
                href={`/quotations/${q.id}`}
                className="block"
              >
                <div className="rounded-3xl bg-white shadow-md border border-pink-100 hover:shadow-2xl hover:border-pink-300 transition duration-300 p-6">

                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">

                    <div className="space-y-3">

                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-2xl font-bold text-pink-950">
                          {q.client_name}
                        </h2>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            q.status
                          )}`}
                        >
                          {q.status || "Draft"}
                        </span>
                      </div>

                      <div className="space-y-1 text-gray-600">
                        <p>
                          <span className="font-semibold text-gray-800">
                            Quote No:
                          </span>{" "}
                          {q.quote_number}
                        </p>

                        <p>
                          <span className="font-semibold text-gray-800">
                            Event:
                          </span>{" "}
                          {q.event_type || "Bridal Event"}
                        </p>

                        <p>
                          <span className="font-semibold text-gray-800">
                            Date:
                          </span>{" "}
                          {q.event_date || "-"}
                        </p>

                        <p>
                          <span className="font-semibold text-gray-800">
                            Location:
                          </span>{" "}
                          {q.location || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="md:text-right">
                      <p className="text-sm uppercase tracking-wide text-gray-400">
                        Total Quote
                      </p>

                      <h3 className="mt-1 text-3xl font-bold text-pink-900">
                        ₹{Number(q.grand_total || 0).toLocaleString()}
                      </h3>

                      <div className="mt-4 inline-flex items-center rounded-xl bg-pink-50 px-4 py-2 text-sm font-semibold text-pink-700">
                        View Details →
                      </div>
                    </div>

                  </div>

                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}