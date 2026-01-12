import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import SongRequestForm from "../components/SongRequestForm";
import { STRIPE_PUBLISHABLE_KEY } from "../config";
import { useDjContext } from "../context/DjContext";

const stripePromise = STRIPE_PUBLISHABLE_KEY
  ? loadStripe(STRIPE_PUBLISHABLE_KEY)
  : null;

function PaymentPanel({
  clientSecret,
  amountCents,
  onConfirm,
}: {
  clientSecret: string;
  amountCents: number;
  onConfirm: (paymentIntentId: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError("");
    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });
    if (stripeError) {
      setError(stripeError.message || "No se pudo procesar el pago");
      setLoading(false);
      return;
    }
    if (paymentIntent?.id) {
      onConfirm(paymentIntent.id);
    }
    setLoading(false);
  };

  return (
    <div className="card p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Completa la propina
        </h3>
        <p className="text-sm text-gray-500">
          Total: €{(amountCents || 0) / 100}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <PaymentElement />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={loading || !stripe}>
          {loading ? "Procesando..." : "Pagar propina"}
        </button>
      </form>
      <p className="text-xs text-gray-500">
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
    createRequest,
    pendingPayment,
    confirmPayment,
    playlistTracks,
    playlistName,
    playlistLoading,
    playlistError,
    voteNotice,
    voteError,
    voteCooldownUntil,
    loadPublicPlaylist,
    voteTrack,
  } = useDjContext();
  const { joinCode: joinParam } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (joinParam) {
      setJoinCode(joinParam.toUpperCase());
    }
  }, [joinParam, setJoinCode]);

  useEffect(() => {
    if (joinCode) {
      loadPublicPlaylist(joinCode);
    }
  }, [joinCode, loadPublicPlaylist]);

  const [voteRemaining, setVoteRemaining] = useState(0);

  useEffect(() => {
    const tick = () => {
      if (!voteCooldownUntil) {
        setVoteRemaining(0);
        return;
      }
      const remaining = Math.max(
        0,
        Math.ceil((voteCooldownUntil - Date.now()) / 1000)
      );
      setVoteRemaining(remaining);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [voteCooldownUntil]);

  const formatRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const stripeOptions = useMemo(() => {
    if (!pendingPayment?.clientSecret) return null;
    return { clientSecret: pendingPayment.clientSecret };
  }, [pendingPayment?.clientSecret]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    navigate(`/event/${joinCode.trim().toUpperCase()}`);
  };

  return (
    <div className="page-shell">
      <div className="container py-10 space-y-6">
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Tu evento</h2>
            <span className="text-xs uppercase tracking-[0.3em] text-gray-400">
              #{joinCode || "--"}
            </span>
          </div>
          <form onSubmit={handleJoin} className="space-y-2">
            <label className="text-sm text-gray-600">Código</label>
            <input
              className="input"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            />
            <button className="btn-secondary">Cambiar código</button>
          </form>
        </div>

        <div className="card p-5 space-y-3">
          <label className="text-sm text-gray-600">Apodo (opcional)</label>
          <input
            className="input"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={40}
          />
        </div>

        <SongRequestForm onSubmit={createRequest} />

        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Vota canciones
            </h3>
            <span className="text-xs uppercase tracking-[0.3em] text-gray-400">
              {playlistName || "Playlists"}
            </span>
          </div>
          {voteRemaining > 0 && (
            <p className="text-sm text-gray-500">
              Puedes votar de nuevo en {formatRemaining(voteRemaining)}
            </p>
          )}
          {playlistLoading ? (
            <p className="text-sm text-gray-500">Cargando listas...</p>
          ) : playlistError ? (
            <p className="text-sm text-gray-500">{playlistError}</p>
          ) : playlistTracks.length === 0 ? (
            <p className="text-sm text-gray-500">
              No hay canciones para votar.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  Top votadas
                </h4>
                <ul className="mt-2 space-y-2 text-sm text-gray-700">
                  {playlistTracks.slice(0, 5).map((track, index) => (
                    <li
                      key={track.trackId}
                      className="flex items-center justify-between"
                    >
                      <span>
                        {index + 1}. {track.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {track.votes} votos
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  Todas las canciones
                </h4>
                <ul className="mt-2 space-y-3">
                  {playlistTracks.map((track) => (
                    <li
                      key={track.trackId}
                      className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {track.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {track.artists || "Artista desconocido"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">
                          {track.votes} votos
                        </span>
                        <button
                          className="btn-secondary"
                          onClick={() => voteTrack(track.trackId)}
                          disabled={voteRemaining > 0}
                        >
                          Votar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {voteNotice && (
            <p className="text-sm text-green-600">{voteNotice}</p>
          )}
          {voteError && <p className="text-sm text-red-600">{voteError}</p>}
        </div>

        {pendingPayment && stripePromise && stripeOptions && (
          <Elements stripe={stripePromise} options={stripeOptions}>
            <PaymentPanel
              clientSecret={pendingPayment.clientSecret}
              amountCents={pendingPayment.amountCents}
              onConfirm={(id) => confirmPayment(pendingPayment.requestId, id)}
            />
          </Elements>
        )}

        {requestNotice && <p className="text-sm text-green-600">{requestNotice}</p>}
        {requestError && <p className="text-sm text-red-600">{requestError}</p>}
      </div>
    </div>
  );
}
