import React, { useState } from "react";

const TIP_OPTIONS = [0, 1, 2, 5];

export default function SongRequestForm({ onAddRequest }) {
  const [song, setSong] = useState("");
  const [tip, setTip] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!song.trim()) return;

    onAddRequest({
      id: Date.now(),
      song: song.trim(),
      votes: 0,
      tip,
    });

    setSong("");
    setTip(0);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto mt-8 p-4 bg-white shadow-md rounded-xl space-y-4"
    >
      <h2 className="text-xl font-semibold">Pide una canción</h2>

      <input
        type="text"
        placeholder="Nombre de la canción"
        className="w-full border px-3 py-2 rounded-lg"
        value={song}
        onChange={(e) => setSong(e.target.value)}
        required
      />

      <div className="flex gap-4 items-center">
        <span>Propina:</span>
        {TIP_OPTIONS.map((amount) => (
          <label
            key={amount}
            className="cursor-pointer flex items-center gap-1 select-none"
          >
            <input
              type="radio"
              name="tip"
              value={amount}
              checked={tip === amount}
              onChange={() => setTip(amount)}
              className="cursor-pointer"
            />
            <span>{amount === 0 ? "0€ (sin propina)" : `${amount}€`}</span>
          </label>
        ))}
      </div>

      <button
        type="submit"
        className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition"
      >
        Enviar
      </button>
    </form>
  );
}

