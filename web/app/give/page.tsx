"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { apiFetch } from "@/lib/api";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");
const FUNDS = ["General", "Building", "Missions", "Benevolence"];

function CheckoutForm() {
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
      confirmParams: { return_url: `${window.location.origin}/give?success=1` },
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
      <button type="submit" disabled={!stripe || status === "processing"} className="w-full rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white disabled:opacity-50">
        {status === "processing" ? "Processing…" : "Give Securely"}
      </button>
      {message && <p className={status === "error" ? "text-red-600" : "text-green-600"}>{message}</p>}
    </form>
  );
}

export default function GivePage() {
  const [amount, setAmount] = useState("50");
  const [fund, setFund] = useState("General");
  const [recurring, setRecurring] = useState(false);
  const [interval, setInterval] = useState("month");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function startDonation() {
    setError("");
    const cents = Math.round(parseFloat(amount) * 100);
    if (!cents || cents < 100) {
      setError("Minimum gift is $1");
      return;
    }
    try {
      if (recurring) {
        const data = await apiFetch<{ url: string }>("/giving/recurring/checkout", {
          method: "POST",
          body: JSON.stringify({ amount_cents: cents, fund, interval }),
        });
        if (data.url) window.location.href = data.url;
        else setError("Could not start recurring checkout");
        return;
      }
      const data = await apiFetch<{ client_secret: string }>("/giving/intent", {
        method: "POST",
        body: JSON.stringify({ amount_cents: cents, fund }),
      });
      setClientSecret(data.client_secret);
    } catch (e: any) {
      setError(e.message || "Could not start donation");
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Give</h1>
        <p className="mt-2 text-slate-600">Your generosity fuels ministry and care.</p>
      </div>
      {!clientSecret ? (
        <div className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
          <div>
            <label className="block text-sm font-medium">Amount (USD)</label>
            <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Fund</label>
            <select value={fund} onChange={(e) => setFund(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2">
              {FUNDS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
            Make this a recurring gift
          </label>
          {recurring && (
            <select value={interval} onChange={(e) => setInterval(e.target.value)} className="w-full rounded-lg border px-3 py-2">
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="button" onClick={startDonation} className="w-full rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white">
            Continue
          </button>
        </div>
      ) : (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm />
          </Elements>
        </div>
      )}
    </div>
  );
}
