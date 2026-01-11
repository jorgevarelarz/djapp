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
      className="max-w-md mx-auto p-6 rounded-2xl space-y-4 card-vercel"
    >
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">
          Pedido rapido
        </p>
        <h2 className="text-2xl font-semibold text-white">
          Pide una canción
        </h2>
      </div>

      <input
        type="text"
        placeholder="Nombre de la canción"
        className="input-vercel h-11 text-white placeholder:text-white/40"
        value={song}
        onChange={(e) => setSong(e.target.value)}
        maxLength={120}
        required
      />

      <input
        type="text"
        placeholder="Artista (opcional)"
        className="input-vercel h-11 text-white placeholder:text-white/40"
        value={artist}
        onChange={(e) => setArtist(e.target.value)}
        maxLength={80}
      />

      <textarea
        placeholder="Mensaje para el DJ (opcional)"
        className="input-vercel min-h-[96px] text-white placeholder:text-white/40"
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
        className="btn-primary w-full h-11"
      >
        Enviar
      </button>
    </form>
  );
}
