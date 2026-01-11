import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import SongRequestForm from "../components/SongRequestForm";
import { STRIPE_PUBLISHABLE_KEY } from "../config";
import { useAppContext } from "../context/AppContext";

const stripePromise = STRIPE_PUBLISHABLE_KEY
  ? loadStripe(STRIPE_PUBLISHABLE_KEY)
  : null;

function PaymentPanel({ clientSecret, amountCents, onConfirm }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError("");
    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });
    if (stripeError) {
      setError(stripeError.message || "No se pudo procesar el pago.");
      setLoading(false);
      return;
    }
    if (paymentIntent?.id) {
      onConfirm(paymentIntent);
    }
    setLoading(false);
  };

  return (
    <div className="card-vercel rounded-2xl p-5 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-white">
          Completa la propina
        </h3>
        <p className="text-sm text-white/60">
          Total: €{(amountCents || 0) / 100}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <PaymentElement />
        {error && <p className="text-sm text-red-300">{error}</p>}
        <button
          type="submit"
          disabled={!stripe || loading}
          className="btn-primary w-full h-10 disabled:opacity-60"
        >
          {loading ? "Procesando..." : "Pagar propina"}
        </button>
      </form>
      <p className="text-xs text-white/40">
        Apple Pay y Google Pay se muestran si tu dispositivo lo soporta.
      </p>
    </div>
  );
}

export default function GuestEvent() {
  const {
    joinCode,
    setJoinCode,
    nickname,
    setNickname,
    requestNotice,
    requestError,
    setRequestNotice,
    setRequestError,
    handleCreateRequest,
    pendingPayment,
    confirmPayment,
  } = useAppContext();
  const { joinCode: joinCodeParam } = useParams();
  const navigate = useNavigate();

  const stripeOptions = useMemo(() => {
    if (!pendingPayment?.clientSecret) return null;
    return {
      clientSecret: pendingPayment.clientSecret,
      appearance: { theme: "night" },
    };
  }, [pendingPayment?.clientSecret]);

  useEffect(() => {
    if (joinCodeParam) {
      setJoinCode(joinCodeParam.toUpperCase());
    }
    setRequestNotice("");
    setRequestError("");
  }, [joinCodeParam, setJoinCode, setRequestNotice, setRequestError]);

  const handleJoinCodeSubmit = (e) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setRequestError("Ingresa un codigo de evento");
      return;
    }
    setRequestError("");
    navigate(`/event/${joinCode.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between text-sm text-white/70">
          <Link to="/" className="underline">
            Volver
          </Link>
          <span>Invitado</span>
        </div>

        <div className="card-vercel rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Tu evento</h2>
            <span className="text-xs uppercase tracking-[0.3em] text-white/60">
              #{joinCode || "--"}
            </span>
          </div>
          <form onSubmit={handleJoinCodeSubmit} className="space-y-2">
            <label className="block text-sm font-semibold text-white/70">
              Codigo
            </label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="input-vercel h-10 text-white placeholder:text-white/40"
            />
            <button
              type="submit"
              className="btn-secondary h-9 px-3"
            >
              Cambiar codigo
            </button>
          </form>
        </div>

        <div className="card-vercel rounded-2xl p-5 space-y-3">
          <label className="block text-sm font-semibold text-white/70">
            Apodo (opcional)
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Tu nombre"
            className="input-vercel h-10 text-white placeholder:text-white/40"
            maxLength={40}
          />
        </div>

        <SongRequestForm onAddRequest={handleCreateRequest} />

        {pendingPayment && stripePromise && stripeOptions ? (
          <Elements stripe={stripePromise} options={stripeOptions}>
            <PaymentPanel
              clientSecret={pendingPayment.clientSecret}
              amountCents={pendingPayment.amountCents}
              onConfirm={(intent) =>
                confirmPayment(pendingPayment.requestId, intent.id)
              }
            />
          </Elements>
        ) : null}

        {pendingPayment && !stripePromise && (
          <div className="card-vercel rounded-2xl p-5">
            <p className="text-sm text-red-300">
              Stripe no está configurado en el frontend.
            </p>
          </div>
        )}

        {requestNotice && (
          <p className="text-emerald-300 text-center">{requestNotice}</p>
        )}
        {requestError && (
          <p className="text-red-300 text-center">{requestError}</p>
        )}
      </div>
    </div>
  );
}
