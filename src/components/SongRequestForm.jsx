import React, { useState } from "react";

const TIP_OPTIONS = [0, 1, 2, 5];

export default function SongRequestForm({ onAddRequest }) {
  const [song, setSong] = useState("");
  const [artist, setArtist] = useState("");
  const [message, setMessage] = useState("");
  const [tip, setTip] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!song.trim()) return;

    onAddRequest({
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
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto p-6 rounded-2xl space-y-4 bb-card"
    >
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">
          Pedido rapido
        </p>
        <h2 className="text-2xl font-semibold bb-title text-white">
          Pide una canción
        </h2>
      </div>

      <input
        type="text"
        placeholder="Nombre de la canción"
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
        value={song}
        onChange={(e) => setSong(e.target.value)}
        maxLength={120}
        required
      />

      <input
        type="text"
        placeholder="Artista (opcional)"
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
        value={artist}
        onChange={(e) => setArtist(e.target.value)}
        maxLength={80}
      />

      <textarea
        placeholder="Mensaje para el DJ (opcional)"
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={200}
      />

      <div className="space-y-2">
        <span className="text-sm text-white/60">Propina</span>
        <div className="flex flex-wrap gap-2">
          {TIP_OPTIONS.map((amount) => (
            <label
              key={amount}
              className={`cursor-pointer rounded-full border px-3 py-1 text-sm transition ${
                tip === amount
                  ? "border-white/30 bg-white/20 text-white"
                  : "border-white/10 bg-white/5 text-white/60 hover:border-white/30"
              }`}
            >
              <input
                type="radio"
                name="tip"
                value={amount}
                checked={tip === amount}
                onChange={() => setTip(amount)}
                className="sr-only"
              />
              {amount === 0 ? "0€ (sin propina)" : `${amount}€`}
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-white py-2 font-semibold text-black transition hover:bg-gray-200"
      >
        Enviar
      </button>
    </form>
  );
}
