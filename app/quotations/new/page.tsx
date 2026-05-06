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

  const [existingClient, setExistingClient] = useState<ExistingClient | null>(null);

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

      if (data) {
        setExistingClient(data);
      } else {
        setExistingClient(null);
      }
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

      setMessage(`Quotation saved successfully. Quote number: ${quoteNumber}`);

      setClientName("");
      setClientPhone("");
      setClientCity("");
      setInstagramHandle("");
      setClientNotes("");
      setExistingClient(null);
      setEventType("");
      setEventDate("");
      setLocation("");
      setPackageName("");
      setServices([{ service_name: "", price: "" }]);
      setExtraCharges("");
      setDiscount("");
      setNotes("");
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
    <main className="min-h-screen bg-pink-50 p-6">
      <div className="mx-auto max-w-6xl rounded-3xl bg-white p-8 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">New Quotation</h1>
            <p className="mt-2 text-gray-600">
              Create quotation, save client, and track enquiry in one step.
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
              href="/clients"
              className="rounded-xl border border-pink-300 px-4 py-2 font-semibold text-pink-700 hover:bg-pink-50"
            >
              Clients
            </Link>
          </div>
        </div>

        <form onSubmit={handleSaveQuotation} className="mt-8 space-y-8">
          <div className="rounded-2xl border border-pink-100 bg-pink-50 p-6">
            <h2 className="text-2xl font-semibold text-gray-900">Client Details</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input
                type="text"
                placeholder="Client name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-pink-500"
                required
              />

              <input
                type="text"
                placeholder="Phone number"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-pink-500"
                required
              />

              <input
                type="text"
                placeholder="City"
                value={clientCity}
                onChange={(e) => setClientCity(e.target.value)}
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
                placeholder="Client notes"
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-pink-500 md:col-span-2"
                rows={3}
              />
            </div>

            {existingClient && (
              <div className="mt-4 rounded-2xl border border-pink-200 bg-white p-4">
                <p className="font-semibold text-pink-700">Existing client found</p>
                <p className="mt-2 text-sm text-gray-700">
                  Name: {existingClient.name} <br />
                  Phone: {existingClient.phone || "-"} <br />
                  City: {existingClient.city || "-"}
                </p>
                <button
                  type="button"
                  onClick={handleUseExistingClient}
                  className="mt-3 rounded-xl bg-pink-600 px-4 py-2 text-white"
                >
                  Use Existing Client Details
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-pink-100 bg-pink-50 p-6">
            <h2 className="text-2xl font-semibold text-gray-900">Event Details</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input
                type="text"
                placeholder="Event type"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-pink-500"
              />

              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-pink-500"
              />

              <input
                type="text"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-pink-500 md:col-span-2"
              />

              <input
                type="text"
                placeholder="Package name"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-pink-500 md:col-span-2"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-pink-100 bg-pink-50 p-6">
            <h2 className="text-2xl font-semibold text-gray-900">Services & Pricing</h2>

            <div className="mt-4 space-y-4">
              {services.map((service, index) => (
                <div key={index} className="grid gap-3 md:grid-cols-[2fr_1fr_auto]">
                  <input
                    type="text"
                    placeholder="Service name"
                    value={service.service_name}
                    onChange={(e) =>
                      handleServiceChange(index, "service_name", e.target.value)
                    }
                    className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-pink-500"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={service.price}
                    onChange={(e) =>
                      handleServiceChange(index, "price", e.target.value)
                    }
                    className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-pink-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeServiceRow(index)}
                    className="rounded-xl border border-pink-300 px-4 py-2 text-pink-700"
                  >
                    Remove
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addServiceRow}
                className="rounded-xl border border-pink-300 px-4 py-2 font-semibold text-pink-700 hover:bg-pink-50"
              >
                Add Service
              </button>

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="number"
                  placeholder="Extra charges"
                  value={extraCharges}
                  onChange={(e) => setExtraCharges(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-pink-500"
                />

                <input
                  type="number"
                  placeholder="Discount"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-pink-500"
                />
              </div>

              <textarea
                placeholder="Quotation notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-pink-500"
                rows={3}
              />

              <div className="rounded-2xl bg-white p-4">
                <p><strong>Subtotal:</strong> ₹{subtotal}</p>
                <p><strong>Grand Total:</strong> ₹{grandTotal}</p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-pink-600 px-6 py-3 font-semibold text-white hover:bg-pink-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Quotation"}
          </button>

          {message && (
            <p className="rounded-xl bg-pink-50 p-4 text-sm text-pink-700">
              {message}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}