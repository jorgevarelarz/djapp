import React from "react";

const DJPanel = ({ requests, onPlay, onMarkAsPlayed, onBanDevice }) => {
  return (
    <div className="p-6 rounded-2xl max-w-4xl mx-auto bb-card-strong">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">
            Cabina BeatBid
          </p>
          <h2 className="text-3xl font-semibold bb-title">Panel del DJ</h2>
        </div>
        <span className="text-sm text-white/60">
          {requests.length} solicitudes
        </span>
      </div>

      {requests.length === 0 ? (
        <p className="text-gray-300 text-center text-lg italic">
          No hay canciones en la lista.
        </p>
      ) : (
        <ul className="space-y-4">
          {requests.map((request) => (
            <li
              key={request.id}
              className={`flex flex-col gap-4 rounded-xl border p-4 transition ${
                request.tipAmount > 0
                  ? "border-emerald-300/40 bg-emerald-300/10"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-xl font-semibold truncate max-w-xs sm:max-w-none">
                    {request.songTitle}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-white/70">
                    {request.nickname && <span>por {request.nickname}</span>}
                    {request.artist && <span>• {request.artist}</span>}
                  </div>
                  {request.message && (
                    <p className="text-sm text-white/60">{request.message}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {request.tipAmount > 0 ? (
                    <span className="rounded-full bg-emerald-300/20 px-3 py-1 text-sm text-emerald-100">
                      💸 {request.tipAmount} €
                    </span>
                  ) : (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/70">
                      🕒 {request.status}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {onPlay && (
                  <button
                    onClick={() => onPlay(request.id)}
                    className="rounded-lg bg-emerald-300/90 px-4 py-2 font-semibold text-slate-900 transition hover:bg-emerald-300"
                    title={`Reproducir ${request.songTitle}`}
                  >
                    ▶ Reproducir
                  </button>
                )}
                {onMarkAsPlayed && (
                  <button
                    onClick={() => onMarkAsPlayed(request.id)}
                    className="rounded-lg bg-white/10 px-4 py-2 font-semibold text-white transition hover:bg-white/20"
                    title={`Marcar ${request.songTitle} como tocada`}
                  >
                    ✔ Tocada
                  </button>
                )}
                {onBanDevice && request.deviceHash && (
                  <button
                    onClick={() => onBanDevice(request.deviceHash)}
                    className="rounded-lg border border-red-300/40 bg-red-500/20 px-4 py-2 font-semibold text-red-100 transition hover:bg-red-500/30"
                    title="Bloquear dispositivo"
                  >
                    🚫 Bloquear
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DJPanel;
