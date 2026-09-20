"use client";

import { useState } from "react";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

const FUNDS = ["General", "Building", "Missions", "Benevolence"];

function CheckoutForm({ donationId }: { donationId: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setStatus("processing");

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/give?success=1`,
      },
      redirect: "if_required",
    });

    if (error) {
      setStatus("error");
      setMessage(error.message || "Payment failed");
    } else {
      setStatus("success");
      setMessage("Thank you for your generosity!");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || status === "processing"}
        className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {status === "processing" ? "Processing…" : "Give Securely"}
      </button>
      {message && (
        <p className={status === "error" ? "text-red-600" : "text-green-600"}>{message}</p>
      )}
      {status === "success" && (
        <p className="text-sm text-slate-500">
          Gift #{donationId} recorded.{" "}
          {isLoggedIn() && (
            <Link href="/profile" className="text-blue-600 underline">
              View on your profile
            </Link>
          )}
        </p>
      )}
    </form>
  );
}

export default function GivePage() {
  const [amount, setAmount] = useState("50");
  const [fund, setFund] = useState("General");
  const [recurring, setRecurring] = useState(false);
  const [interval, setInterval] = useState("month");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [donationId, setDonationId] = useState<number | null>(null);
  const [demoDone, setDemoDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function startDonation() {
    setError("");
    setDemoDone(false);
    const cents = Math.round(parseFloat(amount) * 100);
    if (!cents || cents < 100) {
      setError("Minimum gift is $1");
      return;
    }
    setLoading(true);
    try {
      if (recurring) {
        if (!isLoggedIn()) {
          setError("Sign in to set up a recurring gift.");
          return;
        }
        const data = await apiFetch<{
          url?: string | null;
          demo?: boolean;
          message?: string;
          recurring_id?: number;
        }>("/giving/recurring/checkout", {
          method: "POST",
          body: JSON.stringify({ amount_cents: cents, fund, interval }),
        });
        if (data.url) {
          window.location.href = data.url;
          return;
        }
        if (data.demo) {
          setDemoDone(true);
          setDonationId(data.recurring_id ?? null);
          return;
        }
        setError(data.message || "Could not start recurring checkout");
        return;
      }

      const data = await apiFetch<{ client_secret: string; donation_id: number }>(
        "/giving/intent",
        {
          method: "POST",
          body: JSON.stringify({ amount_cents: cents, fund }),
        }
      );

      // Demo mode: API has no Stripe secret — gift is already saved as succeeded
      if (!data.client_secret || data.client_secret === "demo_secret") {
        setDonationId(data.donation_id);
        setDemoDone(true);
        return;
      }

      setClientSecret(data.client_secret);
      setDonationId(data.donation_id);
    } catch (e: any) {
      setError(e.message || "Could not start donation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Give</h1>
        <p className="mt-2 text-slate-600">
          Your generosity fuels ministry, missions, and care for our community.
        </p>
        {!stripeKey && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <strong>Demo mode:</strong> no Stripe keys configured. Gifts are saved in the database
            for testing (no real card charge).
          </p>
        )}
      </div>

      {demoDone && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
          <p className="text-lg font-semibold text-green-800">Thank you!</p>
          <p className="mt-2 text-sm text-green-700">
            {recurring
              ? "Recurring gift recorded (demo)."
              : `One-time gift recorded (demo)${donationId ? ` · #${donationId}` : ""}.`}
          </p>
          {isLoggedIn() ? (
            <Link href="/profile" className="mt-4 inline-block text-sm font-semibold text-blue-600 underline">
              See giving history on your profile
            </Link>
          ) : (
            <p className="mt-3 text-sm text-slate-600">
              <Link href="/login" className="text-blue-600 underline">
                Sign in
              </Link>{" "}
              before giving next time so the gift is linked to your account.
            </p>
          )}
          <button
            type="button"
            className="mt-4 text-sm text-slate-600 underline"
            onClick={() => {
              setDemoDone(false);
              setClientSecret(null);
              setDonationId(null);
            }}
          >
            Give again
          </button>
        </div>
      )}

      {!clientSecret && !demoDone && (
        <div className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
          <div>
            <label className="block text-sm font-medium">Amount (USD)</label>
            <input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Fund</label>
            <select
              value={fund}
              onChange={(e) => setFund(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            >
              {FUNDS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
            />
            Make this a recurring gift
          </label>
          {recurring && (
            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="button"
            onClick={startDonation}
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Please wait…" : recurring ? "Start recurring gift" : "Continue"}
          </button>
        </div>
      )}

      {clientSecret && clientSecret !== "demo_secret" && stripePromise && donationId && (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm donationId={donationId} />
          </Elements>
        </div>
      )}
    </div>
  );
}
