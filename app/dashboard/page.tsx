"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Profile = {
  artist_name: string | null;
  business_name: string | null;
  email: string | null;
  city: string | null;
  contact_number: string | null;
  instagram_url: string | null;
};

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  const [profile, setProfile] = useState<Profile | null>(null);

  const [artistName, setArtistName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [city, setCity] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const getUserAndProfile = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
      setUserEmail(user.email || "");

      const { data } = await supabase
        .from("profiles")
        .select("artist_name, business_name, email, city, contact_number, instagram_url")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
        setArtistName(data.artist_name || "");
        setBusinessName(data.business_name || "");
        setContactNumber(data.contact_number || "");
        setCity(data.city || "");
        setInstagramUrl(data.instagram_url || "");
      }

      setLoading(false);
    };

    getUserAndProfile();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) return;

    setSaveMessage("");

    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      email: userEmail,
      artist_name: artistName,
      business_name: businessName,
      contact_number: contactNumber,
      instagram_url: instagramUrl,
      city,
    });

    if (error) {
      setSaveMessage(error.message);
      return;
    }

    setProfile({
      artist_name: artistName,
      business_name: businessName,
      email: userEmail,
      city,
      contact_number: contactNumber,
      instagram_url: instagramUrl,
    });

    setSaveMessage("Profile saved successfully.");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-pink-50 flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-pink-50 p-6">
      <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome{profile?.artist_name ? `, ${profile.artist_name}` : ""}
            </h1>
            <p className="mt-2 text-gray-600">
              This is your first dashboard screen.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/quotations"
              className="rounded-xl border border-pink-300 px-4 py-2 font-semibold text-pink-700"
            >
             Quotations
            </Link>

            <Link
              href="/quotations/new"
              className="rounded-xl border border-pink-300 px-4 py-2 font-semibold text-pink-700 hover:bg-pink-50"
            >
              New Quotation
            </Link>

            <Link
              href="/bookings"
              className="rounded-xl border border-pink-300 px-4 py-2 font-semibold text-pink-700 hover:bg-pink-50"
            >
              Bookings
            </Link>

            <Link
              href="/clients"
              className="rounded-xl border border-pink-300 px-4 py-2 font-semibold text-pink-700 hover:bg-pink-50"
            >
              Clients
            </Link>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-pink-300 px-4 py-2 font-semibold text-pink-700 hover:bg-pink-50"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-pink-100 bg-pink-50 p-6">
          <h2 className="text-2xl font-semibold text-gray-900">Your Profile</h2>
          <p className="mt-2 text-gray-600">
            Complete your business details below.
          </p>

          <form onSubmit={handleSaveProfile} className="mt-6 grid gap-4 md:grid-cols-2">
            <input
              type="text"
              placeholder="Artist name"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-pink-500"
              required
            />

            <input
              type="text"
              placeholder="Business name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-pink-500"
            />

            <input
              type="text"
              placeholder="Contact number"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
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
              placeholder="Instagram URL"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-pink-500 md:col-span-2"
            />

            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded-xl bg-pink-600 px-5 py-3 font-semibold text-white hover:bg-pink-700"
              >
                Save Profile
              </button>
            </div>
          </form>

          {saveMessage && (
            <p className="mt-4 rounded-xl bg-white p-3 text-sm text-pink-700">
              {saveMessage}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}