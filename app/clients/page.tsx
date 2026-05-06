"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ClientRow = {
  id: string;
  name: string;
  phone: string | null;
  city: string | null;
  instagram_handle: string | null;
  notes: string | null;
  created_at: string;
};

export default function ClientsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  const [clients, setClients] = useState<ClientRow[]>([]);

  const loadClients = async (artistId: string) => {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("artist_id", artistId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setClients(data);
    }
  };

  useEffect(() => {
    const initPage = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
      await loadClients(user.id);
      setLoading(false);
    };

    initPage();
  }, [router]);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!userId) return;

    const { error } = await supabase.from("clients").insert({
      artist_id: userId,
      name,
      phone,
      city,
      instagram_handle: instagramHandle,
      notes,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setName("");
    setPhone("");
    setCity("");
    setInstagramHandle("");
    setNotes("");
    setMessage("Client added successfully.");

    await loadClients(userId);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-pink-50 flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading clients...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-pink-50 p-6">
      <div className="mx-auto max-w-6xl rounded-3xl bg-white p-8 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
            <p className="mt-2 text-gray-600">
              Save and manage your client list here.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl border border-pink-300 px-4 py-2 font-semibold text-pink-700 hover:bg-pink-50"
            >
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-xl border border-pink-300 px-4 py-2 font-semibold text-pink-700 hover:bg-pink-50"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-pink-100 bg-pink-50 p-6">
            <h2 className="text-2xl font-semibold text-gray-900">Add Client</h2>
            <p className="mt-2 text-gray-600">
              Start building your client database.
            </p>

            <form onSubmit={handleAddClient} className="mt-6 space-y-4">
              <input
                type="text"
                placeholder="Client name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-pink-500"
                required
              />

              <input
                type="text"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-pink-500"
              />

              <input
                type="text"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-pink-500"
              />

              <input
                type="text"
                placeholder="Instagram handle"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-pink-500"
              />

              <textarea
                placeholder="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-pink-500"
                rows={4}
              />

              <button
                type="submit"
                className="rounded-xl bg-pink-600 px-5 py-3 font-semibold text-white hover:bg-pink-700"
              >
                Save Client
              </button>
            </form>

            {message && (
              <p className="mt-4 rounded-xl bg-white p-3 text-sm text-pink-700">
                {message}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-pink-100 bg-white p-6">
            <h2 className="text-2xl font-semibold text-gray-900">Saved Clients</h2>
            <p className="mt-2 text-gray-600">
              Your recent clients will appear here.
            </p>

            <div className="mt-6 space-y-4">
              {clients.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-pink-200 p-6 text-gray-500">
                  No clients added yet.
                </div>
              ) : (
                clients.map((client) => (
                  <div
                    key={client.id}
                    className="rounded-2xl border border-pink-100 bg-pink-50 p-4"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">
                      {client.name}
                    </h3>
                    <div className="mt-2 space-y-1 text-sm text-gray-700">
                      <p><strong>Phone:</strong> {client.phone || "-"}</p>
                      <p><strong>City:</strong> {client.city || "-"}</p>
                      <p><strong>Instagram:</strong> {client.instagram_handle || "-"}</p>
                      <p><strong>Notes:</strong> {client.notes || "-"}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}