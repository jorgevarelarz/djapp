import React from "react";
import { Play, Check, Ban, DollarSign, X, CreditCard, Music } from "lucide-react";

export default function DJPanel({
  requests,
  onPlay,
  onMarkAsPlayed,
  onBanDevice,
  onAcceptPayment,
  onRejectPayment,
}) {
  const statusLabel = (status) => {
    switch (status) {
      case "playing":
        return "Reproduciendo";
      case "done":
        return "Hecha";
      case "rejected":
        return "Rechazada";
      default:
        return "En cola";
    }
  };

  const statusClass = (status) => {
    switch (status) {
      case "playing":
        return "border-blue-500/40 text-blue-300 bg-blue-500/10";
      case "done":
        return "border-emerald-500/40 text-emerald-300 bg-emerald-500/10";
      case "rejected":
        return "border-red-500/40 text-red-300 bg-red-500/10";
      default:
        return "border-white/20 text-white/60 bg-white/5";
    }
  };
  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-white/10 bg-white/5">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 ring-1 ring-white/10">
          <Music className="w-6 h-6 text-white/40" />
        </div>
        <p className="text-white text-lg font-semibold">La pista está tranquila</p>
        <p className="text-sm text-white/40 mt-1 max-w-xs text-center">
          Comparte el código del evento para empezar a recibir peticiones.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {requests.map((req) => {
        const hasTip = req.tipAmount > 0;
        return (
          <li key={req.id}>
            <div
              className={`relative group flex flex-col gap-4 p-4 rounded-xl border transition-all duration-200 ${
                hasTip
                  ? "bg-emerald-500/5 border-emerald-500/30 shadow-[0_0_0_1px_rgba(16,185,129,0.1)]"
                  : "bg-white/5 border-white/10 hover:border-white/20"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h4 className="text-lg font-bold text-white truncate leading-tight">
                      {req.songTitle}
                    </h4>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wide border font-medium ${statusClass(
                        req.status
                      )}`}
                    >
                      {statusLabel(req.status)}
                    </span>
                    {hasTip && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-500 text-black">
                        <DollarSign className="w-3 h-3" />
                        {req.tipAmount}
                      </span>
                    )}
                    {hasTip && (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wide border font-medium ${
                          req.paymentStatus === "requires_capture"
                            ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                            : req.paymentStatus === "canceled"
                            ? "border-red-500/40 text-red-400 bg-red-500/10"
                            : "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                        }`}
                      >
                        {req.paymentStatus === "requires_capture"
                          ? "Autorizar cobro"
                          : req.paymentStatus === "canceled"
                          ? "Cancelado"
                          : "Cobrado"}
                      </span>
                    )}
                  </div>

                  <p className="text-white/60 text-sm flex items-center gap-2">
                    <span className="truncate">
                      {req.artist || "Artista desconocido"}
                    </span>
                    {req.nickname && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-white/30" />
                        <span className="text-white/40">de {req.nickname}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {req.message && (
                <div className="text-sm text-white/70 italic bg-black/40 p-3 rounded-lg border-l-2 border-white/20">
                  "{req.message}"
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5 mt-2">
                {hasTip && req.paymentStatus === "requires_capture" && (
                  <div className="flex gap-2 mr-auto w-full sm:w-auto mb-2 sm:mb-0">
                    <button
                      onClick={() => onAcceptPayment(req.id)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-sm font-medium hover:bg-emerald-500/20 transition-colors"
                    >
                      <CreditCard className="w-4 h-4" /> Cobrar
                    </button>
                    <button
                      onClick={() => onRejectPayment(req.id)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md text-sm font-medium hover:bg-red-500/20 transition-colors"
                    >
                      <X className="w-4 h-4" /> Rechazar
                    </button>
                  </div>
                )}

                <div
                  className={`flex gap-2 w-full sm:w-auto ${
                    !(hasTip && req.paymentStatus === "requires_capture")
                      ? "ml-auto"
                      : ""
                  }`}
                >
                  <button
                    onClick={() => onPlay(req.id)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 bg-white text-black border border-white rounded-md text-sm font-bold hover:bg-gray-200 transition-colors"
                  >
                    <Play className="w-4 h-4 fill-current" /> Play
                  </button>

                  <button
                    onClick={() => onMarkAsPlayed(req.id)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 bg-transparent text-white border border-white/20 rounded-md text-sm font-medium hover:bg-white/10 transition-colors"
                  >
                    <Check className="w-4 h-4" /> Hecho
                  </button>

                  <button
                    onClick={() => onBanDevice(req.deviceHash)}
                    className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors border border-transparent hover:border-red-500/20"
                    title="Bloquear usuario"
                  >
                    <Ban className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
