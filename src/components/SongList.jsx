import React from "react";

export default function SongList({ songs, onVote }) {
  if (!songs.length)
    return (
      <p className="text-center mt-6 text-gray-500">
        No hay canciones pedidas aún.
      </p>
    );

  return (
    <ul className="max-w-md mx-auto mt-6 space-y-3">
      {songs.map(({ id, song, tip, votes }) => (
        <li
          key={id}
          className="flex justify-between items-center bg-white p-3 rounded shadow"
        >
          <div>
            <p className="font-semibold">{song}</p>
            <p className="text-sm text-gray-600">
              Propina: {tip}€ · Votos: {votes}
            </p>
          </div>
          <button
            onClick={() => onVote(id)}
            className="text-green-600 hover:text-green-800 font-bold text-xl"
            aria-label={`Votar canción ${song}`}
          >
            👍
          </button>
        </li>
      ))}
    </ul>
  );
}

