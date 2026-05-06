"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function BookingDetailPage() {
  const params = useParams();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadBookingData() {
    setLoading(true);

    const { data: bookingData, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !bookingData) {
      console.error("Booking error:", bookingError);
      setBooking(null);
      setLoading(false);
      return;
    }

    let clientData = null;

    if (bookingData.client_id) {
      const { data } = await supabase
        .from("clients")
        .select("*")
        .eq("id", bookingData.client_id)
        .single();

      clientData = data;
    }

    const { data: paymentsData, error: paymentsError } = await supabase
      .from("payments")
      .select("*")
      .eq("booking_id", bookingId)
      .order("payment_date", { ascending: false });

    if (paymentsError) {
      console.error("Payments error:", paymentsError);
    }

    setBooking({
      ...bookingData,
      clients: clientData,
    });

    setPayments(paymentsData || []);
    setLoading(false);
  }

  useEffect(() => {
    if (bookingId) {
      loadBookingData();
    }
  }, [bookingId]);

  async function handleAddPayment(e: React.FormEvent) {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please login again.");
      return;
    }

    const paymentAmount = Number(amount);

    if (!paymentAmount || paymentAmount <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }

    const { error } = await supabase.from("payments").insert({
      booking_id: bookingId,
      user_id: user.id,
      amount: paymentAmount,
      payment_mode: paymentMode,
      notes,
    });

    if (error) {
      console.error("Payment save error:", error);
      alert("Payment could not be saved.");
      return;
    }

    const updatedPayments = [...payments, { amount: paymentAmount }];

    const laterPaidTotal = updatedPayments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );

    const advanceAmount = Number(booking.advance_amount || 0);
    const totalAmount = Number(booking.total_amount || 0);
    const totalPaid = advanceAmount + laterPaidTotal;

    let paymentStatus = "pending";

    if (totalPaid >= totalAmount) {
      paymentStatus = "fully_paid";
    } else if (totalPaid > 0) {
      paymentStatus = "partial";
    }

    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        payment_status: paymentStatus,
        balance_amount: Math.max(totalAmount - totalPaid, 0),
      })
      .eq("id", bookingId);

    if (updateError) {
      console.error("Booking payment status update error:", updateError);
      alert("Payment saved, but booking status could not be updated.");
    }

    setAmount("");
    setPaymentMode("");
    setNotes("");

    await loadBookingData();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-pink-50 flex items-center justify-center">
        <p className="text-gray-600 text-lg">Loading booking...</p>
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="min-h-screen bg-pink-50 flex items-center justify-center">
        <p className="text-red-600 text-lg">Booking not found.</p>
      </main>
    );
  }

  const totalAmount = Number(booking.total_amount || 0);
  const advanceAmount = Number(booking.advance_amount || 0);
  const laterPaid = payments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );

  const totalPaid = advanceAmount + laterPaid;
  const balance = Math.max(totalAmount - totalPaid, 0);
  const isFullyPaid = balance <= 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-pink-900">Booking Details</h1>
          <p className="text-gray-600 mt-1">
            Track payment, balance and event information
          </p>
        </div>

        <section className="bg-white rounded-3xl shadow-lg p-6 border border-pink-100">
          <h2 className="text-xl font-semibold text-pink-900 mb-4">
            Client & Event
          </h2>

          <div className="grid md:grid-cols-2 gap-4 text-gray-700">
            <p>
              <b>Client:</b>{" "}
              {booking.clients?.name || booking.client_name || "Unknown Client"}
            </p>

            <p>
              <b>Phone:</b>{" "}
              {booking.clients?.phone || booking.client_phone || "-"}
            </p>

            <p>
              <b>Event:</b>{" "}
              {booking.event_type || booking.event_name || "Event"}
            </p>

            <p>
              <b>Event Date:</b> {booking.event_date || "-"}
            </p>

            <p>
              <b>Location:</b> {booking.location || "-"}
            </p>

            <p>
              <b>Status:</b>{" "}
              <span
                className={
                  isFullyPaid
                    ? "text-green-600 font-semibold"
                    : "text-orange-600 font-semibold"
                }
              >
                {isFullyPaid ? "Fully Paid" : "Payment Pending"}
              </span>
            </p>

            <p>
              <b>DB Payment Status:</b>{" "}
              <span className="font-semibold text-pink-800">
                {booking.payment_status || "pending"}
              </span>
            </p>
          </div>
        </section>

        <section className="grid md:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl shadow p-5 border border-pink-100">
            <p className="text-gray-500">Total Amount</p>
            <h3 className="text-2xl font-bold text-gray-900">
              ₹{totalAmount.toLocaleString()}
            </h3>
          </div>

          <div className="bg-white rounded-3xl shadow p-5 border border-pink-100">
            <p className="text-gray-500">Advance Paid</p>
            <h3 className="text-2xl font-bold text-pink-700">
              ₹{advanceAmount.toLocaleString()}
            </h3>
          </div>

          <div className="bg-white rounded-3xl shadow p-5 border border-pink-100">
            <p className="text-gray-500">Received Later</p>
            <h3 className="text-2xl font-bold text-gray-900">
              ₹{laterPaid.toLocaleString()}
            </h3>
          </div>

          <div className="bg-white rounded-3xl shadow p-5 border border-pink-100">
            <p className="text-gray-500">Balance</p>
            <h3
              className={`text-2xl font-bold ${
                isFullyPaid ? "text-green-600" : "text-red-500"
              }`}
            >
              ₹{balance.toLocaleString()}
            </h3>
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-lg p-6 border border-pink-100">
          <h2 className="text-xl font-semibold text-pink-900 mb-4">
            Mark Payment Received
          </h2>

          <form onSubmit={handleAddPayment} className="grid md:grid-cols-3 gap-4">
            <input
              type="number"
              required
              placeholder="Amount received"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-pink-300"
            />

            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-pink-300"
            >
              <option value="">Payment mode</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Card">Card</option>
            </select>

            <input
              type="text"
              placeholder="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-pink-300"
            />

            <button
              type="submit"
              className="md:col-span-3 bg-pink-800 text-white rounded-xl py-3 font-semibold hover:bg-pink-900 transition"
            >
              Save Payment
            </button>
          </form>
        </section>

        <section className="bg-white rounded-3xl shadow-lg p-6 border border-pink-100">
          <h2 className="text-xl font-semibold text-pink-900 mb-4">
            Payment History
          </h2>

          {payments.length === 0 ? (
            <p className="text-gray-500">
              No additional payments received yet.
            </p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="border border-pink-100 rounded-2xl p-4 bg-pink-50/40"
                >
                  <p className="font-semibold text-gray-900">
                    ₹{Number(payment.amount || 0).toLocaleString()}
                  </p>

                  <p className="text-sm text-gray-500">
                    {payment.payment_mode || "Mode not added"} ·{" "}
                    {payment.payment_date || "-"}
                  </p>

                  {payment.notes && (
                    <p className="text-sm text-gray-600 mt-1">
                      {payment.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}