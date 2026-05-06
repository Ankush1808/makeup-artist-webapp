"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import jsPDF from "jspdf";

type Profile = {
  artist_name: string | null;
  business_name: string | null;
  contact_number: string | null;
  instagram_url: string | null;
  city: string | null;
  email: string | null;
};

type Quotation = {
  id: string;
  artist_id: string;
  quote_number: string;
  client_id: string;
  event_type: string | null;
  event_date: string | null;
  location: string | null;
  package_name: string | null;
  subtotal: number | null;
  extra_charges: number | null;
  discount: number | null;
  grand_total: number | null;
  status: string;
  notes: string | null;
  created_at: string;
};

type Client = {
  id: string;
  name: string;
  phone: string | null;
  city: string | null;
  instagram_handle: string | null;
  notes: string | null;
};

type QuotationItem = {
  id: string;
  service_name: string;
  price: number | null;
};

type Booking = {
  id: string;
  booking_status: string;
  advance_amount: number | null;
  balance_amount: number | null;
  total_amount: number | null;
  notes: string | null;
};

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quotationId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [booking, setBooking] = useState<Booking | null>(null);

  const [advanceAmount, setAdvanceAmount] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [converting, setConverting] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const formatMoney = (value: number | null | undefined) => {
    return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
  };

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("artist_name, business_name, contact_number, instagram_url, city, email")
        .eq("id", user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
      }

      const { data: quotationData, error: quotationError } = await supabase
        .from("quotations")
        .select("*")
        .eq("id", quotationId)
        .eq("artist_id", user.id)
        .maybeSingle();

      if (quotationError || !quotationData) {
        setMessage("Quotation not found or you do not have access.");
        setLoading(false);
        return;
      }

      setQuotation(quotationData);

      const { data: clientData } = await supabase
        .from("clients")
        .select("*")
        .eq("id", quotationData.client_id)
        .maybeSingle();

      if (clientData) {
        setClient(clientData);
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from("quotation_items")
        .select("*")
        .eq("quotation_id", quotationId)
        .order("created_at", { ascending: true });

      if (!itemsError && itemsData) {
        setItems(itemsData);
      }

      const { data: bookingData } = await supabase
        .from("bookings")
        .select("*")
        .eq("quotation_id", quotationId)
        .maybeSingle();

      if (bookingData) {
        setBooking(bookingData);
      }

      setLoading(false);
    };

    loadData();
  }, [quotationId, router]);

  const handleConvertToBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!quotation) return;

    setConverting(true);
    setMessage("");

    const advance = Number(advanceAmount || 0);
    const total = Number(quotation.grand_total || 0);
    const balance = Math.max(total - advance, 0);

    try {
      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          artist_id: quotation.artist_id,
          client_id: quotation.client_id,
          quotation_id: quotation.id,
          event_type: quotation.event_type,
          event_date: quotation.event_date,
          location: quotation.location,
          package_name: quotation.package_name,
          booking_status: "confirmed",
          advance_amount: advance,
          balance_amount: balance,
          total_amount: total,
          notes: bookingNotes,
        })
        .select()
        .single();

      if (bookingError) {
        setMessage(bookingError.message);
        setConverting(false);
        return;
      }

      const { error: quotationUpdateError } = await supabase
        .from("quotations")
        .update({ status: "converted" })
        .eq("id", quotation.id);

      if (quotationUpdateError) {
        setMessage(quotationUpdateError.message);
        setConverting(false);
        return;
      }

      setQuotation({
        ...quotation,
        status: "converted",
      });

      setBooking(bookingData);
      setMessage("Quotation converted to booking successfully.");
    } catch {
      setMessage("Something went wrong while converting the quotation.");
    } finally {
      setConverting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!quotation) return;

    setDownloadingPdf(true);
    setMessage("");

    try {
      const doc = new jsPDF("p", "mm", "a4");

      const pageWidth = 210;
      const margin = 16;
      let y = 18;

      const brandName = profile?.business_name || "Makeup Artist Studio";
      const artistName = profile?.artist_name || "";
      const contact = profile?.contact_number || "";
      const instagram = profile?.instagram_url || "";
      const artistCity = profile?.city || "";
      const email = profile?.email || "";

      const blush = [157, 23, 77] as const;
      const softBlush = [253, 242, 248] as const;
      const dark = [31, 41, 55] as const;
      const muted = [107, 114, 128] as const;
      const gold = [180, 124, 43] as const;

      // Background
      doc.setFillColor(255, 250, 252);
      doc.rect(0, 0, 210, 297, "F");

      // Top luxury header block
      doc.setFillColor(...softBlush);
      doc.roundedRect(margin, y, pageWidth - margin * 2, 36, 4, 4, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(...blush);
      doc.text(brandName, margin + 6, y + 13);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...muted);
      const profileLine = [artistName, contact, artistCity].filter(Boolean).join(" | ");
      doc.text(profileLine || "Luxury makeup quotation", margin + 6, y + 22);

      if (email || instagram) {
        doc.text([email, instagram].filter(Boolean).join(" | "), margin + 6, y + 29);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(...dark);
      doc.text("QUOTATION", pageWidth - margin - 6, y + 14, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...muted);
      doc.text(quotation.quote_number || "-", pageWidth - margin - 6, y + 23, {
        align: "right",
      });

      y += 48;

      // Quote + event summary
      doc.setDrawColor(245, 207, 222);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, y, pageWidth - margin * 2, 42, 4, 4, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...blush);
      doc.text("Client Details", margin + 6, y + 9);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...dark);
      doc.text(`Name: ${client?.name || "-"}`, margin + 6, y + 18);
      doc.text(`Phone: ${client?.phone || "-"}`, margin + 6, y + 25);
      doc.text(`City: ${client?.city || "-"}`, margin + 6, y + 32);
      doc.text(`Instagram: ${client?.instagram_handle || "-"}`, margin + 6, y + 39);

      const rightX = 112;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...blush);
      doc.text("Event Details", rightX, y + 9);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...dark);
      doc.text(`Event: ${quotation.event_type || "-"}`, rightX, y + 18);
      doc.text(`Date: ${quotation.event_date || "-"}`, rightX, y + 25);
      doc.text(`Location: ${quotation.location || "-"}`, rightX, y + 32);
      doc.text(`Package: ${quotation.package_name || "-"}`, rightX, y + 39);

      y += 55;

      // Services section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...blush);
      doc.text("Services Included", margin, y);

      y += 8;

      doc.setFillColor(...softBlush);
      doc.roundedRect(margin, y, pageWidth - margin * 2, 10, 3, 3, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...dark);
      doc.text("Service", margin + 5, y + 7);
      doc.text("Amount", pageWidth - margin - 5, y + 7, { align: "right" });

      y += 14;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...dark);

      if (items.length === 0) {
        doc.text("No services found.", margin + 5, y);
        y += 8;
      } else {
        items.forEach((item) => {
          if (y > 240) {
            doc.addPage();
            doc.setFillColor(255, 250, 252);
            doc.rect(0, 0, 210, 297, "F");
            y = 20;
          }

          doc.setDrawColor(245, 207, 222);
          doc.line(margin, y + 2, pageWidth - margin, y + 2);

          doc.text(item.service_name || "-", margin + 5, y + 8);
          doc.text(formatMoney(item.price), pageWidth - margin - 5, y + 8, {
            align: "right",
          });

          y += 12;
        });
      }

      y += 4;

      // Pricing summary box
      if (y > 220) {
        doc.addPage();
        doc.setFillColor(255, 250, 252);
        doc.rect(0, 0, 210, 297, "F");
        y = 20;
      }

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(245, 207, 222);
      doc.roundedRect(112, y, 82, 40, 4, 4, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...blush);
      doc.text("Pricing Summary", 118, y + 9);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...dark);
      doc.text("Subtotal", 118, y + 18);
      doc.text(formatMoney(quotation.subtotal), 188, y + 18, { align: "right" });

      doc.text("Extra Charges", 118, y + 25);
      doc.text(formatMoney(quotation.extra_charges), 188, y + 25, { align: "right" });

      doc.text("Discount", 118, y + 32);
      doc.text(formatMoney(quotation.discount), 188, y + 32, { align: "right" });

      doc.setFont("helvetica", "bold");
      doc.setTextColor(...gold);
      doc.text("Grand Total", 118, y + 39);
      doc.text(formatMoney(quotation.grand_total), 188, y + 39, { align: "right" });

      y += 52;

      // Notes
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...blush);
      doc.text("Notes", margin, y);

      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...muted);
      const notesText = quotation.notes || "Thank you for considering our services. We look forward to making your special day beautiful.";
      const splitNotes = doc.splitTextToSize(notesText, 175);
      doc.text(splitNotes, margin, y);

      // Footer
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...muted);
      doc.text("This quotation is system-generated.", 105, 287, {
        align: "center",
      });

      doc.save(`${quotation.quote_number}.pdf`);
      setMessage("Luxury PDF downloaded successfully.");
    } catch {
      setMessage("Something went wrong while downloading the PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-pink-50 flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading quotation...</p>
      </main>
    );
  }

  if (!quotation) {
    return (
      <main className="min-h-screen bg-pink-50 p-6">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-xl">
          <p className="text-pink-700">{message || "Quotation not found."}</p>
          <div className="mt-4">
            <Link
              href="/quotations"
              className="rounded-xl border border-pink-300 px-4 py-2 font-semibold text-pink-700 hover:bg-pink-50"
            >
              Back to Quotations
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-pink-50 p-6">
      <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {quotation.quote_number}
            </h1>
            <p className="mt-2 text-gray-600">
              View your saved quotation details.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/quotations"
              className="rounded-xl border border-pink-300 px-4 py-2 font-semibold text-pink-700 hover:bg-pink-50"
            >
              Quotations
            </Link>

            <Link
              href="/quotations/new"
              className="rounded-xl border border-pink-300 px-4 py-2 font-semibold text-pink-700 hover:bg-pink-50"
            >
              New Quotation
            </Link>

            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="rounded-xl border border-pink-300 px-4 py-2 font-semibold text-pink-700 hover:bg-pink-50 disabled:opacity-60"
            >
              {downloadingPdf ? "Downloading..." : "Download Luxury PDF"}
            </button>
          </div>
        </div>

        {message && (
          <p className="mt-6 rounded-xl bg-pink-50 p-4 text-sm text-pink-700">
            {message}
          </p>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-pink-100 bg-pink-50 p-6">
            <h2 className="text-xl font-semibold text-gray-900">Client Details</h2>
            <div className="mt-4 space-y-2 text-gray-700">
              <p><strong>Name:</strong> {client?.name || "-"}</p>
              <p><strong>Phone:</strong> {client?.phone || "-"}</p>
              <p><strong>City:</strong> {client?.city || "-"}</p>
              <p><strong>Instagram:</strong> {client?.instagram_handle || "-"}</p>
              <p><strong>Client Notes:</strong> {client?.notes || "-"}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-pink-100 bg-pink-50 p-6">
            <h2 className="text-xl font-semibold text-gray-900">Event Details</h2>
            <div className="mt-4 space-y-2 text-gray-700">
              <p><strong>Event Type:</strong> {quotation.event_type || "-"}</p>
              <p><strong>Event Date:</strong> {quotation.event_date || "-"}</p>
              <p><strong>Location:</strong> {quotation.location || "-"}</p>
              <p><strong>Package:</strong> {quotation.package_name || "-"}</p>
              <p><strong>Status:</strong> {quotation.status || "-"}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-pink-100 bg-pink-50 p-6">
          <h2 className="text-xl font-semibold text-gray-900">Services</h2>

          <div className="mt-4 space-y-3">
            {items.length === 0 ? (
              <p className="text-gray-500">No services found.</p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl bg-white p-4"
                >
                  <p className="text-gray-800">{item.service_name}</p>
                  <p className="font-semibold text-gray-900">{formatMoney(item.price)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-pink-100 bg-pink-50 p-6">
          <h2 className="text-xl font-semibold text-gray-900">Pricing Summary</h2>

          <div className="mt-4 space-y-2 text-gray-700">
            <p><strong>Subtotal:</strong> {formatMoney(quotation.subtotal)}</p>
            <p><strong>Extra Charges:</strong> {formatMoney(quotation.extra_charges)}</p>
            <p><strong>Discount:</strong> {formatMoney(quotation.discount)}</p>
            <p><strong>Grand Total:</strong> {formatMoney(quotation.grand_total)}</p>
            <p><strong>Notes:</strong> {quotation.notes || "-"}</p>
          </div>
        </div>

        {!booking ? (
          <div className="mt-6 rounded-2xl border border-pink-100 bg-pink-50 p-6">
            <h2 className="text-xl font-semibold text-gray-900">Convert to Booking</h2>
            <p className="mt-2 text-gray-600">
              Once the client confirms, convert this quotation into a booking.
            </p>

            <form onSubmit={handleConvertToBooking} className="mt-6 space-y-4">
              <input
                type="number"
                placeholder="Advance amount received"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-pink-500"
              />

              <textarea
                placeholder="Booking notes"
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-pink-500"
                rows={3}
              />

              <button
                type="submit"
                disabled={converting}
                className="rounded-xl bg-pink-600 px-5 py-3 font-semibold text-white hover:bg-pink-700 disabled:opacity-60"
              >
                {converting ? "Converting..." : "Convert to Booking"}
              </button>
            </form>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-green-100 bg-green-50 p-6">
            <h2 className="text-xl font-semibold text-gray-900">Booking Created</h2>
            <div className="mt-4 space-y-2 text-gray-700">
              <p><strong>Status:</strong> {booking.booking_status || "-"}</p>
              <p><strong>Total Amount:</strong> {formatMoney(booking.total_amount)}</p>
              <p><strong>Advance Received:</strong> {formatMoney(booking.advance_amount)}</p>
              <p><strong>Balance Due:</strong> {formatMoney(booking.balance_amount)}</p>
              <p><strong>Notes:</strong> {booking.notes || "-"}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}