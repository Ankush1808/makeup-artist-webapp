"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Client = {
  id: string;
  name: string;
};

type Enquiry = {
  id: string;
  event_type: string | null;
  event_date: string | null;
  location: string | null;
  budget: number | null;
  status: string;
  created_at: string;
  client: { name: string };
};

export default function EnquiriesPage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);

  const [clientId, setClientId] = useState("");
  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const { data: clientData } = await supabase
        .from("clients")
        .select("id, name")
        .eq("artist_id", user.id);

      if (clientData) setClients(clientData);

      loadEnquiries(user.id);
    };

    init();
  }, []);

  const loadEnquiries = async (artistId: string) => {
    const { data } = await supabase
      .from("enquiries")
      .select(`
        *,
        client:clients(name)
      `)
      .eq("artist_id", artistId)
      .order("created_at", { ascending: false });

    if (data) setEnquiries(data);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) return;

    const { error } = await supabase.from("enquiries").insert({
      artist_id: userId,
      client_id: clientId,
      event_type: eventType,
      event_date: eventDate,
      location,
      budget: budget ? Number(budget) : null,
      notes,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Enquiry added");

    setEventType("");
    setEventDate("");
    setLocation("");
    setBudget("");
    setNotes("");

    await loadEnquiries(userId);
  };

  return (
    <main className="min-h-screen bg-pink-50 p-6">
      <div className="mx-auto max-w-6xl bg-white p-8 rounded-3xl shadow-xl">
        <div className="flex justify-between">
          <h1 className="text-3xl font-bold">Enquiries</h1>
          <Link href="/dashboard">Dashboard</Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mt-6">

          <form onSubmit={handleAdd} className="space-y-4">
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full p-3 border rounded-xl"
              required
            >
              <option value="">Select Client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <input
              placeholder="Event Type"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full p-3 border rounded-xl"
            />

            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full p-3 border rounded-xl"
            />

            <input
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-3 border rounded-xl"
            />

            <input
              placeholder="Budget"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full p-3 border rounded-xl"
            />

            <textarea
              placeholder="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 border rounded-xl"
            />

            <button className="bg-pink-600 text-white p-3 rounded-xl">
              Add Enquiry
            </button>

            {message && <p>{message}</p>}
          </form>

          <div>
            <h2 className="text-xl font-semibold mb-4">Saved Enquiries</h2>

            {enquiries.map((e) => (
              <div key={e.id} className="p-4 border rounded-xl mb-3">
                <p><strong>Client:</strong> {e.client?.name}</p>
                <p><strong>Event:</strong> {e.event_type}</p>
                <p><strong>Date:</strong> {e.event_date}</p>
                <p><strong>Status:</strong> {e.status}</p>
                <p><strong>Budget:</strong> {e.budget}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </main>
  );
}