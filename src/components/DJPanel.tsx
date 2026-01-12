import React from "react";
import { Play, Check, Ban, DollarSign, X } from "lucide-react";
import { RequestItem } from "../context/DjContext";

type Props = {
  requests: RequestItem[];
  mode: "pending" | "queue";
  onApprove?: (request: RequestItem) => void;
  onReject?: (request: RequestItem) => void;
  onPlay: (id: number) => void;
  onMarkAsPlayed: (id: number) => void;
  onBanDevice: (deviceHash?: string | null) => void;
};

export default function DJPanel({
  requests,
  mode,
  onApprove,
  onReject,
  onPlay,
  onMarkAsPlayed,
  onBanDevice,
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
                {mode === "pending" ? (
                  <>
                    <button
                      className="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
                      onClick={() => onApprove?.(req)}
                    >
                      Aprobar
                    </button>
                    <button
                      className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                      onClick={() => onReject?.(req)}
                    >
                      Rechazar
                    </button>
                    <button
                      className="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-black"
                      onClick={() => onBanDevice(req.deviceHash)}
                    >
                      Bloquear
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn-primary"
                      onClick={() => onPlay(req.id)}
                    >
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
                      className="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-black"
                      onClick={() => onBanDevice(req.deviceHash)}
                    >
                      Bloquear
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
