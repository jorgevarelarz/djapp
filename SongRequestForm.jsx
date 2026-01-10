import React, { useState } from "react";

const TIP_OPTIONS = [0, 1, 2, 5]; // euros

export default function SongRequestForm({ onAddSong }) {
  const [songName, setSongName] = useState("");
  const [tip, setTip] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (songName.trim() === "") return;
    onAddSong({
      id: Date.now(),
      name: songName.trim(),
      votes: 0,
      tip,
    });
    setSongName("");
    setTip(0);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 space-y-2">
      <input
        type="text"
        placeholder="Nombre de la canción"
        value={songName}
        onChange={(e) => setSongName(e.target.value)}
        className="w-full border border-gray-300 rounded px-3 py-2"
      />

      <div className="flex items-center gap-4">
        <span>Propina:</span>
        {TIP_OPTIONS.map((amount) => (
          <label key={amount} className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name="tip"
              value={amount}
              checked={tip === amount}
              onChange={() => setTip(amount)}
            />
            <span>{amount === 0 ? "0€ (sin propina)" : `${amount}€`}</span>
          </label>
        ))}
      </div>

      <button
        type="submit"
        className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
      >
        Pedir
      </button>
    </form>
  );
}

