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
          (clientsData || []).map((client: ClientRow) => [client.id, client.name])
        );

        const merged: QuotationDisplay[] = (quotationsData || []).map(
          (quotation: QuotationRow) => ({
            ...quotation,
            client_name: clientMap.get(quotation.client_id) || "Unknown client",
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

  if (loading) {
    return (
      <main className="min-h-screen bg-pink-50 flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading quotations...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-pink-50 p-6">
      <div className="mx-auto max-w-6xl rounded-3xl bg-white p-8 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quotations</h1>
            <p className="mt-2 text-gray-600">
              View all your saved quotations here.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl border border-pink-300 px-4 py-2 font-semibold text-pink-700 hover:bg-pink-50"
            >
              Dashboard
            </Link>

            <Link
              href="/quotations/new"
              className="rounded-xl border border-pink-300 px-4 py-2 font-semibold text-pink-700 hover:bg-pink-50"
            >
              New Quotation
            </Link>
          </div>
        </div>

        {message && (
          <p className="mt-6 rounded-xl bg-pink-50 p-4 text-sm text-pink-700">
            {message}
          </p>
        )}

        <div className="mt-6 space-y-4">
          {quotations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-pink-200 p-6 text-gray-500">
              No quotations found yet.
            </div>
          ) : (
            quotations.map((q) => (
              <Link
                key={q.id}
                href={`/quotations/${q.id}`}
                className="block rounded-2xl border border-pink-100 bg-pink-50 p-4 hover:bg-pink-100"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {q.quote_number}
                    </p>
                    <p className="mt-1 text-gray-700">
                      <strong>Client:</strong> {q.client_name}
                    </p>
                    <p className="text-gray-700">
                      <strong>Event:</strong> {q.event_type || "-"}
                    </p>
                    <p className="text-gray-700">
                      <strong>Date:</strong> {q.event_date || "-"}
                    </p>
                    <p className="text-gray-700">
                      <strong>Location:</strong> {q.location || "-"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      ₹{q.grand_total || 0}
                    </p>
                    <p className="mt-1 text-sm text-pink-700">{q.status}</p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
}