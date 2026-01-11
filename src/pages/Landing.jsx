import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

export default function Landing() {
  const { joinCode, setJoinCode, requestError, setRequestError } =
    useAppContext();
  const navigate = useNavigate();

  const handleGuestStart = (e) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setRequestError("Ingresa un codigo de evento");
      return;
    }
    setRequestError("");
    navigate(`/event/${joinCode.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="max-w-4xl w-full grid gap-10 lg:grid-cols-[1.05fr_0.95fr] items-center">
        <div className="space-y-6 bb-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/70">
            BeatBid Live
          </span>
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-semibold bb-title">
              La cabina entiende tus pedidos.
            </h1>
            <p className="text-white/70 text-lg">
              Entra con el codigo del evento, deja tu apodo y manda la cancion.
              Sin cuentas ni fricciones.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-white/60">
            <span>✔️ Cola en tiempo real</span>
            <span>✔️ Propinas destacadas</span>
            <span>✔️ Anti-spam listo</span>
          </div>
        </div>

        <div className="bb-card-strong rounded-2xl p-6 shadow-2xl bb-fade-up">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold bb-title">
              Entrar como invitado
            </h2>
            <p className="text-white/60">Solo necesitas el codigo del evento.</p>
          </div>

          <form onSubmit={handleGuestStart} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold text-white/70">
              Codigo del evento
            </label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
            />
            {requestError && (
              <p className="text-red-300 text-sm">{requestError}</p>
            )}
            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-r from-emerald-300 to-amber-300 py-2 font-semibold text-slate-900 shadow-[0_12px_30px_rgba(53,208,186,0.3)] transition hover:opacity-90"
            >
              Pedir cancion
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-white/60">
            ¿Eres DJ?{" "}
            <Link to="/dj" className="text-emerald-200 underline">
              Acceder
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
