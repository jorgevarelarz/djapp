import React, { useState } from "react";

type Props = {
  onSubmit: (data: {
    songTitle: string;
    artist?: string | null;
    message?: string | null;
    tipAmount: number;
  }) => void;
};

const TIP_OPTIONS = [0, 1, 2, 5];

export default function SongRequestForm({ onSubmit }: Props) {
  const [song, setSong] = useState("");
  const [artist, setArtist] = useState("");
  const [message, setMessage] = useState("");
  const [tip, setTip] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!song.trim()) return;
    onSubmit({
      songTitle: song.trim(),
      artist: artist.trim() || null,
      message: message.trim() || null,
      tipAmount: tip,
    });
    setSong("");
    setArtist("");
    setMessage("");
    setTip(0);
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Pide una canción
        </h2>
        <p className="text-sm text-gray-500">
          Tu petición aparece al DJ en segundos.
        </p>
      </div>
      <input
        className="input"
        placeholder="Nombre de la canción"
        value={song}
        onChange={(e) => setSong(e.target.value)}
        maxLength={120}
        required
      />
      <input
        className="input"
        placeholder="Artista (opcional)"
        value={artist}
        onChange={(e) => setArtist(e.target.value)}
        maxLength={80}
      />
      <textarea
        className="input min-h-[96px]"
        placeholder="Mensaje para el DJ (opcional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={200}
      />
      <div>
        <p className="text-sm text-gray-600 mb-2">Propina</p>
        <div className="flex flex-wrap gap-2">
          {TIP_OPTIONS.map((amount) => (
            <label
              key={amount}
              className={`cursor-pointer rounded-full border px-3 py-1 text-sm ${
                tip === amount
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 text-gray-600"
              }`}
            >
              <input
                type="radio"
                name="tip"
                className="sr-only"
                value={amount}
                checked={tip === amount}
                onChange={() => setTip(amount)}
              />
              {amount === 0 ? "Sin propina" : `${amount}€`}
            </label>
          ))}
        </div>
      </div>
      <button className="btn-primary w-full" type="submit">
        Enviar solicitud
      </button>
    </form>
  );
}
