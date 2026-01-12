import React from "react";
import { Play, Check, Ban, DollarSign, X } from "lucide-react";
import { RequestItem } from "../context/DjContext";

type Props = {
  requests: RequestItem[];
  onPlay: (id: number) => void;
  onMarkAsPlayed: (id: number) => void;
  onBanDevice: (deviceHash?: string | null) => void;
  onAcceptPayment: (id: number) => void;
  onRejectPayment: (id: number) => void;
};

export default function DJPanel({
  requests,
  onPlay,
  onMarkAsPlayed,
  onBanDevice,
  onAcceptPayment,
  onRejectPayment,
}: Props) {
  if (requests.length === 0) {
    return (
      <div className="card p-6 text-center text-sm text-gray-500">
        No hay solicitudes todavía.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => {
        const hasTip = req.tipAmount > 0;
        return (
          <div key={req.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-base font-semibold text-gray-900">
                    {req.songTitle}
                  </h4>
                  {hasTip && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                      <DollarSign className="h-3 w-3" /> {req.tipAmount}€
                    </span>
                  )}
                  {req.status && (
                    <span className="badge text-gray-600">{req.status}</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {req.artist || "Artista desconocido"}
                  {req.nickname ? ` · ${req.nickname}` : ""}
                </p>
                {req.message && (
                  <p className="mt-2 text-sm text-gray-600 italic">
                    “{req.message}”
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {hasTip && req.paymentStatus === "requires_capture" && (
                  <>
                    <button
                      className="btn-secondary"
                      onClick={() => onAcceptPayment(req.id)}
                    >
                      <DollarSign className="h-4 w-4" />
                      Cobrar
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => onRejectPayment(req.id)}
                    >
                      <X className="h-4 w-4" />
                      Rechazar
                    </button>
                  </>
                )}
                <button className="btn-primary" onClick={() => onPlay(req.id)}>
                  <Play className="h-4 w-4" />
                  Play
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => onMarkAsPlayed(req.id)}
                >
                  <Check className="h-4 w-4" />
                  Hecho
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => onBanDevice(req.deviceHash)}
                >
                  <Ban className="h-4 w-4" />
                  Bloquear
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
