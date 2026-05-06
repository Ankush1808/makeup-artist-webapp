"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    business_name: "",
    artist_name: "",
    phone: "",
    instagram: "",
    city: "",
    brand_tagline: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Profile load error:", error);
    }

    if (data) {
      setProfile({
        business_name: data.business_name || "",
        artist_name: data.artist_name || "",
        phone: data.phone || "",
        instagram: data.instagram || "",
        city: data.city || "",
        brand_tagline: data.brand_tagline || "",
      });
    }

    setLoading(false);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      business_name: profile.business_name,
      artist_name: profile.artist_name,
      phone: profile.phone,
      instagram: profile.instagram,
      city: profile.city,
      brand_tagline: profile.brand_tagline,
      updated_at: new Date().toISOString(),
    });

    setSaving(false);

    if (error) {
      console.error("Profile save error:", error);
      alert("Profile could not be saved.");
      return;
    }

    alert("Profile updated successfully ✨");
  }

  function updateField(field: string, value: string) {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-pink-50 flex items-center justify-center">
        <p className="text-gray-600">Loading profile...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-pink-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <section className="bg-white rounded-[2rem] shadow-xl border border-pink-100 p-6 md:p-10">
          <p className="text-sm uppercase tracking-[0.25em] text-pink-500 font-semibold">
            Business Settings
          </p>

          <h1 className="mt-3 text-4xl md:text-5xl font-bold text-pink-950">
            Personalize Your App
          </h1>

          <p className="mt-3 text-gray-600 text-lg max-w-2xl">
            Add your artist and business details so quotations, dashboard and PDFs feel customized for your brand.
          </p>
        </section>

        <div className="grid lg:grid-cols-3 gap-6">
          <form
            onSubmit={saveProfile}
            className="lg:col-span-2 bg-white rounded-3xl shadow-lg border border-pink-100 p-6 md:p-8 space-y-5"
          >
            <h2 className="text-2xl font-bold text-pink-950">
              Profile Details
            </h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Business Name
              </label>
              <input
                value={profile.business_name}
                onChange={(e) => updateField("business_name", e.target.value)}
                placeholder="Makeup By Ruchi"
                className="w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Artist Name
              </label>
              <input
                value={profile.artist_name}
                onChange={(e) => updateField("artist_name", e.target.value)}
                placeholder="Ruchita"
                className="w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  value={profile.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  City
                </label>
                <input
                  value={profile.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="Pune"
                  className="w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Instagram Handle
              </label>
              <input
                value={profile.instagram}
                onChange={(e) => updateField("instagram", e.target.value)}
                placeholder="@makeupbyruchi"
                className="w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Brand Tagline
              </label>
              <input
                value={profile.brand_tagline}
                onChange={(e) => updateField("brand_tagline", e.target.value)}
                placeholder="Luxury bridal makeup for your most special day"
                className="w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-pink-900 px-6 py-4 text-white font-semibold shadow-lg hover:bg-pink-950 transition disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </form>

          <section className="bg-pink-900 text-white rounded-3xl shadow-xl p-6 md:p-8 h-fit">
            <p className="text-sm uppercase tracking-[0.25em] text-pink-200">
              Live Preview
            </p>

            <h2 className="mt-4 text-3xl font-bold">
              {profile.business_name || "Your Business Name"}
            </h2>

            <p className="mt-2 text-pink-100">
              by {profile.artist_name || "Artist Name"}
            </p>

            <div className="mt-6 space-y-3 text-sm text-pink-50">
              <p>📍 {profile.city || "City"}</p>
              <p>📞 {profile.phone || "Phone number"}</p>
              <p>📸 {profile.instagram || "@instagram"}</p>
            </div>

            <div className="mt-6 rounded-2xl bg-white/10 p-4">
              <p className="text-pink-100">
                {profile.brand_tagline ||
                  "Your brand tagline will appear here."}
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}