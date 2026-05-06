"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ExistingClient = {
  id: string;
  name: string;
  phone: string | null;
  city: string | null;
  instagram_handle: string | null;
  notes: string | null;
};

type ServiceItem = {
  service_name: string;
  price: string;
};

export default function NewQuotationPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientCity, setClientCity] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [clientNotes, setClientNotes] = useState("");

  const [existingClient, setExistingClient] = useState<ExistingClient | null>(
    null
  );

  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [packageName, setPackageName] = useState("");

  const [services, setServices] = useState<ServiceItem[]>([
    { service_name: "", price: "" },
  ]);

  const [extraCharges, setExtraCharges] = useState("");
  const [discount, setDiscount] = useState("");
  const [notes, setNotes] = useState("");

  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
      setLoading(false);
    };

    init();
  }, [router]);

  useEffect(() => {
    const lookupClient = async () => {
      if (!userId || !clientPhone.trim()) {
        setExistingClient(null);
        return;
      }

      const { data } = await supabase
        .from("clients")
        .select("*")
        .eq("artist_id", userId)
        .eq("phone", clientPhone.trim())
        .maybeSingle();

      setExistingClient(data || null);
    };

    lookupClient();
  }, [clientPhone, userId]);

  const subtotal = useMemo(() => {
    return services.reduce((sum, item) => {
      const value = Number(item.price || 0);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);
  }, [services]);

  const grandTotal = useMemo(() => {
    return subtotal + Number(extraCharges || 0) - Number(discount || 0);
  }, [subtotal, extraCharges, discount]);

  const handleUseExistingClient = () => {
    if (!existingClient) return;

    setClientName(existingClient.name || "");
    setClientCity(existingClient.city || "");
    setInstagramHandle(existingClient.instagram_handle || "");
    setClientNotes(existingClient.notes || "");
  };

  const handleServiceChange = (
    index: number,
    field: keyof ServiceItem,
    value: string
  ) => {
    const updated = [...services];
    updated[index][field] = value;
    setServices(updated);
  };

  const addServiceRow = () => {
    setServices([...services, { service_name: "", price: "" }]);
  };

  const removeServiceRow = (index: number) => {
    if (services.length === 1) return;
    const updated = services.filter((_, i) => i !== index);
    setServices(updated);
  };

  const handleSaveQuotation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) return;

    setSaving(true);
    setMessage("");

    try {
      let finalClientId = existingClient?.id || null;

      if (!finalClientId) {
        const { data: newClient, error: clientError } = await supabase
          .from("clients")
          .insert({
            artist_id: userId,
            name: clientName,
            phone: clientPhone,
            city: clientCity,
            instagram_handle: instagramHandle,
            notes: clientNotes,
          })
          .select()
          .single();

        if (clientError) {
          setMessage(clientError.message);
          setSaving(false);
          return;
        }

        finalClientId = newClient.id;
      }

      const { data: enquiryData, error: enquiryError } = await supabase
        .from("enquiries")
        .insert({
          artist_id: userId,
          client_id: finalClientId,
          event_type: eventType,
          event_date: eventDate || null,
          location,
          budget: grandTotal || 0,
          status: "quoted",
          notes,
        })
        .select()
        .single();

      if (enquiryError) {
        setMessage(enquiryError.message);
        setSaving(false);
        return;
      }

      const quoteNumber = `QT-${Date.now()}`;

      const { data: quotationData, error: quotationError } = await supabase
        .from("quotations")
        .insert({
          artist_id: userId,
          client_id: finalClientId,
          enquiry_id: enquiryData.id,
          quote_number: quoteNumber,
          event_type: eventType,
          event_date: eventDate || null,
          location,
          package_name: packageName,
          subtotal,
          extra_charges: Number(extraCharges || 0),
          discount: Number(discount || 0),
          grand_total: grandTotal,
          status: "draft",
          notes,
        })
        .select()
        .single();

      if (quotationError) {
        setMessage(quotationError.message);
        setSaving(false);
        return;
      }

      const filteredServices = services.filter(
        (item) => item.service_name.trim() !== ""
      );

      if (filteredServices.length > 0) {
        const itemsPayload = filteredServices.map((item) => ({
          quotation_id: quotationData.id,
          service_name: item.service_name,
          price: Number(item.price || 0),
        }));

        const { error: itemsError } = await supabase
          .from("quotation_items")
          .insert(itemsPayload);

        if (itemsError) {
          setMessage(itemsError.message);
          setSaving(false);
          return;
        }
      }

      router.push(`/quotations/${quotationData.id}`);
    } catch {
      setMessage("Something went wrong while saving the quotation.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-pink-50 flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading new quotation...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-pink-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <section className="rounded-[2rem] bg-white shadow-xl border border-pink-100 p-6 md:p-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-pink-500 font-semibold">
                Luxury Bridal Quotation
              </p>

              <h1 className="mt-3 text-4xl md:text-5xl font-bold text-pink-950">
                Create New Quote
              </h1>

              <p className="mt-3 text-gray-600 text-lg max-w-2xl">
                Create quotation, save client and manage enquiry beautifully in
                one guided flow.
              </p>
            </div>

            <Link
              href="/quotations"
              className="inline-flex items-center justify-center rounded-2xl border border-pink-200 px-5 py-3 font-semibold text-pink-700 hover:bg-pink-50 transition"
            >
              View All Quotes
            </Link>
          </div>
        </section>

        <form onSubmit={handleSaveQuotation} className="space-y-6">
          {message && (
            <div className="rounded-2xl border border-pink-100 bg-pink-50 p-4 text-pink-700">
              {message}
            </div>
          )}

          <section className="rounded-3xl bg-white shadow-lg border border-pink-100 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 text-pink-700 font-bold">
                1
              </div>

              <div>
                <h2 className="text-2xl font-bold text-pink-950">
                  Bride Details
                </h2>
                <p className="text-gray-500">
                  Add bride information and client details
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Bride Name
                </label>
                <input
                  type="text"
                  placeholder="Enter bride name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none focus:ring-2 focus:ring-pink-300"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="Enter phone number"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none focus:ring-2 focus:ring-pink-300"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  City
                </label>
                <input
                  type="text"
                  placeholder="Enter city"
                  value={clientCity}
                  onChange={(e) => setClientCity(e.target.value)}
                  className="w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Instagram Handle
                </label>
                <input
                  type="text"
                  placeholder="@makeupbyruchi"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                  className="w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>
            </div>

            {existingClient && (
              <div className="mt-5 rounded-2xl border border-pink-200 bg-pink-50 p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="font-semibold text-pink-900">
                      Existing client found ✨
                    </p>
                    <p className="text-sm text-pink-700 mt-1">
                      Use previously saved client details.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleUseExistingClient}
                    className="rounded-xl bg-pink-900 px-4 py-2 text-white font-semibold hover:bg-pink-950 transition"
                  >
                    Use Existing Client
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-3xl bg-white shadow-lg border border-pink-100 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 text-pink-700 font-bold">
                2
              </div>

              <div>
                <h2 className="text-2xl font-bold text-pink-950">
                  Event Details
                </h2>
                <p className="text-gray-500">Add bridal event information</p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Event Type
                </label>
                <input
                  type="text"
                  placeholder="Bridal, Reception, Haldi..."
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Event Date
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Event venue or city"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Package Name
                </label>
                <input
                  type="text"
                  placeholder="Luxury Bridal Package"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  className="w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white shadow-lg border border-pink-100 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 text-pink-700 font-bold">
                3
              </div>

              <div>
                <h2 className="text-2xl font-bold text-pink-950">
                  Services & Pricing
                </h2>
                <p className="text-gray-500">
                  Add bridal services and pricing details
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {services.map((service, index) => (
                <div
                  key={index}
                  className="grid gap-4 md:grid-cols-[1fr_180px_auto] items-center rounded-2xl border border-pink-100 bg-pink-50/50 p-4"
                >
                  <input
                    type="text"
                    placeholder="Service name"
                    value={service.service_name}
                    onChange={(e) =>
                      handleServiceChange(
                        index,
                        "service_name",
                        e.target.value
                      )
                    }
                    className="rounded-2xl border border-pink-100 px-4 py-3 outline-none focus:ring-2 focus:ring-pink-300"
                  />

                  <input
                    type="number"
                    placeholder="Price"
                    value={service.price}
                    onChange={(e) =>
                      handleServiceChange(index, "price", e.target.value)
                    }
                    className="rounded-2xl border border-pink-100 px-4 py-3 outline-none focus:ring-2 focus:ring-pink-300"
                  />

                  <button
                    type="button"
                    onClick={() => removeServiceRow(index)}
                    className="rounded-xl border border-red-200 px-4 py-3 text-red-600 hover:bg-red-50 transition"
                  >
                    Remove
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addServiceRow}
                className="rounded-2xl border border-pink-200 px-5 py-3 font-semibold text-pink-700 hover:bg-pink-50 transition"
              >
                + Add Service
              </button>

              <div className="grid gap-5 md:grid-cols-2 mt-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Extra Charges
                  </label>
                  <input
                    type="number"
                    placeholder="Extra charges"
                    value={extraCharges}
                    onChange={(e) => setExtraCharges(e.target.value)}
                    className="w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none focus:ring-2 focus:ring-pink-300"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Discount
                  </label>
                  <input
                    type="number"
                    placeholder="Discount"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none focus:ring-2 focus:ring-pink-300"
                  />
                </div>
              </div>

              <div className="rounded-3xl bg-pink-900 text-white p-6 mt-6">
                <div className="flex items-center justify-between">
                  <p className="text-pink-100">Subtotal</p>
                  <p className="text-xl font-semibold">
                    ₹{subtotal.toLocaleString()}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-pink-100">Grand Total</p>
                  <p className="text-4xl font-bold">
                    ₹{grandTotal.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white shadow-lg border border-pink-100 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 text-pink-700 font-bold">
                4
              </div>

              <div>
                <h2 className="text-2xl font-bold text-pink-950">
                  Additional Notes
                </h2>
                <p className="text-gray-500">Add optional quotation notes</p>
              </div>
            </div>

            <textarea
              placeholder="Additional notes for client..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              className="w-full rounded-2xl border border-pink-100 px-4 py-4 outline-none focus:ring-2 focus:ring-pink-300"
            />
          </section>

          <div className="sticky bottom-24 z-20">
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-3xl bg-pink-900 px-6 py-5 text-lg font-bold text-white shadow-2xl hover:bg-pink-950 transition disabled:opacity-60"
            >
              {saving ? "Saving Quotation..." : "Save Luxury Quotation ✨"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}