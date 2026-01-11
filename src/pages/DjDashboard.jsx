import React, { useState } from "react";
import { Link } from "react-router-dom";
import DJPanel from "../components/DJPanel";
import Login from "../components/Login";
import Register from "../components/Register";
import { useAppContext } from "../context/AppContext";

export default function DjDashboard() {
  const [showRegister, setShowRegister] = useState(false);
  const {
    user,
    event,
    eventName,
    setEventName,
    error,
    djNotice,
    djError,
    loadingRequests,
    sortedRequests,
    handleLoginSuccess,
    handleLogout,
    handleCreateEvent,
    playSong,
    markAsPlayed,
    handleBanDevice,
  } = useAppContext();

  if (!user) {
    return (
      <div className="min-h-screen px-6 py-12">
        {showRegister ? (
          <>
            <Register onRegisterSuccess={() => setShowRegister(false)} />
            <p className="text-center mt-4">
              ¿Ya tienes cuenta?{" "}
              <button
                className="text-emerald-200 underline"
                onClick={() => setShowRegister(false)}
              >
                Iniciar sesión
              </button>
            </p>
          </>
        ) : (
          <>
            <Login onLoginSuccess={handleLoginSuccess} />
            {error && <p className="text-red-300 text-center mt-2">{error}</p>}
            <p className="text-center mt-4">
              ¿No tienes cuenta?{" "}
              <button
                className="text-emerald-200 underline"
                onClick={() => setShowRegister(true)}
              >
                Regístrate
              </button>
            </p>
          </>
        )}
      </div>
    );
  }

  if (user.role !== "DJ") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bb-card rounded-xl p-6 text-center space-y-4">
          <p>No tienes permisos de DJ.</p>
          <button
            className="rounded-lg bg-red-500/20 px-4 py-2 text-red-100"
            onClick={handleLogout}
          >
            Salir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="flex items-center justify-between mb-6 text-sm text-white/70">
        <Link to="/" className="underline">
          Volver
        </Link>
        <button
          className="rounded-lg border border-red-400/40 px-4 py-2 text-red-200 transition hover:bg-red-500/20"
          onClick={handleLogout}
        >
          Cerrar sesión ({user.email})
        </button>
      </div>

      <div className="space-y-6">
        {!event ? (
          <form
            onSubmit={handleCreateEvent}
            className="max-w-md mx-auto p-6 rounded-2xl space-y-4 bb-card"
          >
            <h2 className="text-xl font-semibold">Crear evento</h2>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Nombre del evento"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
            />
            {error && <p className="text-red-300">{error}</p>}
            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-r from-emerald-300 to-amber-300 py-2 font-semibold text-slate-900 shadow-[0_12px_30px_rgba(53,208,186,0.25)] transition hover:opacity-90"
            >
              Crear evento
            </button>
          </form>
        ) : (
          <div className="max-w-3xl mx-auto rounded-2xl p-5 text-center bb-card">
            <p className="text-sm text-white/60">Evento activo</p>
            <h3 className="text-2xl font-semibold">{event.name}</h3>
            <p className="mt-2">
              Codigo para el publico:{" "}
              <span className="font-bold text-lg text-emerald-200">
                {event.joinCode}
              </span>
            </p>
            {loadingRequests && (
              <p className="text-sm text-white/60 mt-2">
                Actualizando solicitudes...
              </p>
            )}
          </div>
        )}

        {djNotice && <p className="text-emerald-200 text-center">{djNotice}</p>}
        {djError && <p className="text-red-300 text-center">{djError}</p>}

        {event && (
          <DJPanel
            requests={sortedRequests}
            onPlay={playSong}
            onMarkAsPlayed={markAsPlayed}
            onBanDevice={handleBanDevice}
          />
        )}
      </div>
    </div>
  );
}
