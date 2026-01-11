import React, { useMemo, useState } from "react";
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
    stripeStatus,
    stripeLoading,
    adminMetrics,
    adminDjs,
    adminLoading,
    handleLoginSuccess,
    handleLogout,
    handleCreateEvent,
    playSong,
    markAsPlayed,
    handleBanDevice,
    acceptRequest,
    rejectRequest,
    connectStripe,
    updateDjCommission,
  } = useAppContext();

  const totalTips = useMemo(() => {
    return sortedRequests.reduce((sum, req) => {
      const isCaptured =
        req.paymentStatus === "captured" || req.paymentStatus === "succeeded";
      if (isCaptured && req.paymentAmountCents) {
        return sum + req.paymentAmountCents / 100;
      }
      return sum;
    }, 0);
  }, [sortedRequests]);

  const formatEuros = (cents) =>
    new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format((cents || 0) / 100);

  const Sidebar = () => (
    <aside className="w-full lg:w-64">
      <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <h2 className="text-lg font-semibold">Panel DJ</h2>
        <p className="text-sm text-white/50">BeatBid</p>
        <nav className="mt-6 space-y-2 text-sm">
          <button className="w-full rounded-lg bg-white/10 px-3 py-2 text-left text-white">
            Inicio
          </button>
          <button className="w-full rounded-lg px-3 py-2 text-left text-white/70 hover:bg-white/5">
            Eventos
          </button>
          <button className="w-full rounded-lg px-3 py-2 text-left text-white/70 hover:bg-white/5">
            Pagos
          </button>
          <button className="w-full rounded-lg px-3 py-2 text-left text-white/70 hover:bg-white/5">
            Spotify
          </button>
          <button className="w-full rounded-lg px-3 py-2 text-left text-white/70 hover:bg-white/5">
            Ajustes
          </button>
        </nav>
      </div>
    </aside>
  );

  if (!user) {
    return (
      <div className="min-h-screen px-6 py-10">
        <div className="mx-auto w-full max-w-6xl">
          <div className="flex flex-col gap-6 lg:flex-row">
            <Sidebar />

            <main className="flex-1 space-y-6">
              <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
                <p className="text-sm text-white/60">Bienvenido</p>
                <h1 className="mt-2 text-2xl font-semibold">
                  Acceso al panel DJ
                </h1>
                <p className="mt-2 text-sm text-white/50">
                  Inicia sesion para crear eventos, gestionar pedidos y recibir
                  propinas.
                </p>
              </div>

              <div className="max-w-lg">
                {showRegister ? (
                  <>
                    <Register onRegisterSuccess={() => setShowRegister(false)} />
                    <p className="text-center mt-4">
                      ¿Ya tienes cuenta?{" "}
                      <button
                        className="text-white/70 underline"
                        onClick={() => setShowRegister(false)}
                      >
                        Iniciar sesión
                      </button>
                    </p>
                  </>
                ) : (
                  <>
                    <Login onLoginSuccess={handleLoginSuccess} />
                    {error && (
                      <p className="text-red-300 text-center mt-2">{error}</p>
                    )}
                    <p className="text-center mt-4">
                      ¿No tienes cuenta?{" "}
                      <button
                        className="text-white/70 underline"
                        onClick={() => setShowRegister(true)}
                      >
                        Regístrate
                      </button>
                    </p>
                  </>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  if (user.isAdmin) {
    return (
      <div className="min-h-screen px-6 py-10">
        <div className="mx-auto w-full max-w-6xl">
          <div className="flex flex-col gap-6 lg:flex-row">
            <Sidebar />

            <div className="flex-1 space-y-6">
              <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-white/60">Panel admin</p>
                  <h1 className="text-2xl font-semibold">Resumen general</h1>
                </div>
                <div className="flex items-center gap-3 text-sm text-white/70">
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
              </header>

              <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
                <p className="text-sm text-white/60">Bienvenido</p>
                <h2 className="mt-2 text-2xl font-semibold">{user.email}</h2>
                <p className="mt-2 text-sm text-white/50">
                  Gestiona comisiones, métricas y DJs activos.
                </p>
              </div>

              <section className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                  <p className="text-sm text-white/60">Donaciones cobradas</p>
                  <h3 className="mt-2 text-2xl font-semibold">
                    {formatEuros(adminMetrics?.totalCapturedCents)}
                  </h3>
                  <p className="mt-2 text-sm text-white/50">
                    Comisión: {formatEuros(adminMetrics?.totalFeesCents)}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                  <p className="text-sm text-white/60">Pagos pendientes</p>
                  <h3 className="mt-2 text-2xl font-semibold">
                    {formatEuros(adminMetrics?.pendingCents)}
                  </h3>
                  <p className="mt-2 text-sm text-white/50">
                    Eventos activos: {adminMetrics?.activeDjs || 0}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                  <p className="text-sm text-white/60">DJs activos</p>
                  <h3 className="mt-2 text-2xl font-semibold">
                    {adminMetrics?.activeDjs || 0}
                  </h3>
                  <p className="mt-2 text-sm text-white/50">
                    DJs totales: {adminMetrics?.totalDjs || 0}
                  </p>
                </div>
              </section>

              <section className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-xl font-semibold">Comisiones por DJ</h3>
                  {adminLoading && (
                    <span className="text-sm text-white/40">
                      Actualizando...
                    </span>
                  )}
                </div>
                {djNotice && (
                  <p className="mb-3 text-sm text-emerald-300">{djNotice}</p>
                )}
                {djError && (
                  <p className="mb-3 text-sm text-red-300">{djError}</p>
                )}
                <div className="space-y-3">
                  {adminDjs.length === 0 ? (
                    <p className="text-sm text-white/50">
                      No hay DJs registrados todavía.
                    </p>
                  ) : (
                    adminDjs.map((dj) => (
                      <div
                        key={dj.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-black/40 p-4 ring-1 ring-white/10"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {dj.email}
                          </p>
                          <p className="text-xs text-white/50">
                            Stripe:{" "}
                            {dj.stripeAccountId
                              ? "Conectado"
                              : "Sin conectar"}
                          </p>
                          <p className="text-xs text-white/50">
                            Cobrado: {formatEuros(dj.capturedCents)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="3000"
                            defaultValue={dj.commissionBps}
                            className="w-24 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
                            onBlur={(e) =>
                              updateDjCommission(dj.id, Number(e.target.value))
                            }
                          />
                          <span className="text-xs text-white/50">
                            bps ({(dj.commissionBps / 100).toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
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
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-6 lg:flex-row">
          <Sidebar />

          <div className="flex-1 space-y-8">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-white/60">Panel DJ</p>
                <h1 className="text-2xl font-semibold">
                  Bienvenido, {user.email}
                </h1>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/70">
                <Link to="/" className="underline">
                  Volver
                </Link>
                <button
                  className="rounded-lg border border-red-400/40 px-4 py-2 text-red-200 transition hover:bg-red-500/20"
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </button>
              </div>
            </header>

            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                <p className="text-sm text-white/60">Facturado (hoy)</p>
                <h3 className="mt-2 text-3xl font-semibold">
                  €{totalTips.toFixed(2)}
                </h3>
                <p className="mt-2 text-sm text-white/50">
                  Propinas capturadas.
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                <p className="text-sm text-white/60">Métodos de cobro</p>
                <h3 className="mt-2 text-xl font-semibold">
                  {stripeStatus.connected
                    ? "Stripe conectado"
                    : "Stripe no conectado"}
                </h3>
                <button
                  className="mt-3 w-full rounded-lg bg-white/10 py-2 text-sm font-semibold text-white/70 ring-1 ring-white/10 hover:bg-white/15 disabled:opacity-50"
                  type="button"
                  onClick={connectStripe}
                  disabled={stripeLoading}
                >
                  {stripeStatus.connected
                    ? "Gestionar Stripe"
                    : "Conectar Stripe"}
                </button>
                <p className="mt-2 text-xs text-white/40">
                  Tarjeta, Apple Pay y Google Pay.
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                <p className="text-sm text-white/60">Spotify</p>
                <h3 className="mt-2 text-xl font-semibold">No conectado</h3>
                <button
                  className="mt-3 w-full rounded-lg bg-white/10 py-2 text-sm font-semibold text-white/70 ring-1 ring-white/10 hover:bg-white/15"
                  type="button"
                  disabled
                >
                  Conectar Spotify
                </button>
                <p className="mt-2 text-xs text-white/40">Próximamente.</p>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
              <div className="space-y-4">
                {!event ? (
                  <form
                    onSubmit={handleCreateEvent}
                    className="rounded-2xl space-y-4 bg-white/5 p-6 ring-1 ring-white/10"
                  >
                    <h2 className="text-xl font-semibold">Crear evento</h2>
                    <input
                      type="text"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      placeholder="Nombre del evento"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                    {error && <p className="text-red-300">{error}</p>}
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-white py-2 font-semibold text-black transition hover:bg-gray-200"
                    >
                      Crear evento
                    </button>
                  </form>
                ) : (
                  <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
                    <p className="text-sm text-white/60">Evento activo</p>
                    <h3 className="mt-2 text-2xl font-semibold">
                      {event.name}
                    </h3>
                    <p className="mt-2 text-sm text-white/60">
                      Código para el público
                    </p>
                    <p className="mt-1 text-2xl font-semibold tracking-[0.2em]">
                      {event.joinCode}
                    </p>
                    {loadingRequests && (
                      <p className="text-xs text-white/50 mt-3">
                        Actualizando solicitudes...
                      </p>
                    )}
                  </div>
                )}

                {djNotice && (
                  <div className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-200 ring-1 ring-emerald-500/30">
                    {djNotice}
                  </div>
                )}
                {djError && (
                  <div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-500/30">
                    {djError}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Cola en vivo</h2>
                  <span className="text-sm text-white/50">
                    {sortedRequests.length} solicitudes
                  </span>
                </div>
                {event && (
                  <DJPanel
                    requests={sortedRequests}
                    onPlay={playSong}
                    onMarkAsPlayed={markAsPlayed}
                    onBanDevice={handleBanDevice}
                    onAcceptPayment={acceptRequest}
                    onRejectPayment={rejectRequest}
                  />
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
