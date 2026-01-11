import React from "react";

export default function DJPanel({
  requests,
  onPlay,
  onMarkAsPlayed,
  onBanDevice,
  onAcceptPayment,
  onRejectPayment,
}) {
  if (requests.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-white/20 rounded-xl bg-white/5">
        <p className="text-white/60 text-lg">La pista está tranquila... 🦗</p>
        <p className="text-sm text-white/40 mt-2">
          Comparte el código del evento para recibir peticiones.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {requests.map((req) => (
        <li key={req.id}>
          <div
            className={`relative group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
              req.tipAmount > 0
                ? "bg-emerald-900/20 border-emerald-500/40"
                : "bg-white/5 border-white/10 hover:border-white/20"
            }`}
          >
            <div className="flex-1 min-w-0 mb-4 sm:mb-0 sm:mr-6">
              <div className="flex items-center gap-3 mb-1">
                <h4 className="text-lg font-semibold text-white truncate leading-tight">
                  {req.songTitle}
                </h4>
                {req.tipAmount > 0 && (
                  <span className="flex-shrink-0 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500 text-black">
                    €{req.tipAmount}
                  </span>
                )}
                {req.tipAmount > 0 && (
                  <span className="flex-shrink-0 px-2 py-0.5 rounded text-[10px] uppercase tracking-wide bg-white/10 text-white/70">
                    {req.paymentStatus === "requires_capture"
                      ? "Pago retenido"
                      : req.paymentStatus === "captured" ||
                        req.paymentStatus === "succeeded"
                      ? "Pago cobrado"
                      : req.paymentStatus === "canceled"
                      ? "Pago cancelado"
                      : "Pago pendiente"}
                  </span>
                )}
              </div>

              <p className="text-white/60 text-sm truncate">
                {req.artist || "Artista desconocido"}
                {req.nickname && (
                  <span className="text-white/40">
                    {" "}
                    • pedido por {req.nickname}
                  </span>
                )}
              </p>

              {req.message && (
                <p className="mt-2 text-sm text-white/80 italic bg-black/30 p-2 rounded border-l-2 border-emerald-500/50 inline-block">
                  "{req.message}"
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {req.tipAmount > 0 && req.paymentStatus === "requires_capture" && (
                <>
                  <button
                    onClick={() => onAcceptPayment(req.id)}
                    className="flex-1 sm:flex-none px-3 py-2 bg-emerald-500/30 text-emerald-100 border border-emerald-500/50 rounded-lg text-sm font-semibold transition hover:bg-emerald-500/40"
                  >
                    Aceptar pago
                  </button>
                  <button
                    onClick={() => onRejectPayment(req.id)}
                    className="flex-1 sm:flex-none px-3 py-2 bg-red-500/20 text-red-100 border border-red-500/40 rounded-lg text-sm font-semibold transition hover:bg-red-500/30"
                  >
                    Rechazar
                  </button>
                </>
              )}
              <button
                onClick={() => onPlay(req.id)}
                className="flex-1 sm:flex-none px-4 py-2 bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 rounded-lg text-sm font-semibold transition hover:bg-emerald-500/30"
              >
                ▶ Play
              </button>
              <button
                onClick={() => onMarkAsPlayed(req.id)}
                className="flex-1 sm:flex-none px-4 py-2 bg-white/10 hover:bg-white/20 text-white/70 border border-white/10 rounded-lg text-sm font-semibold transition"
              >
                ✔ Hecho
              </button>
              <button
                onClick={() => onBanDevice(req.deviceHash)}
                className="px-3 py-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                title="Bloquear usuario"
              >
                🚫
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
