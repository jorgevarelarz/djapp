import React from "react";

const DJPanel = ({ songs, onPlay, onMarkAsPlayed }) => {
  return (
    <div className="p-6 bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 text-white rounded-xl shadow-2xl max-w-3xl mx-auto mt-8">
      <h2 className="text-3xl font-extrabold mb-6 text-center tracking-wide">
        Panel del DJ 🎧
      </h2>

      {songs.length === 0 ? (
        <p className="text-gray-300 text-center text-lg italic">
          No hay canciones en la lista.
        </p>
      ) : (
        <ul className="space-y-4">
          {songs.map((song) => (
            <li
              key={song.id}
              className={`flex flex-col sm:flex-row items-center justify-between p-4 rounded-lg shadow-lg transition transform hover:scale-[1.02] ${
                song.tip > 0
                  ? "bg-green-700 border-l-8 border-green-400"
                  : "bg-gray-800 border-l-8 border-blue-400"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 flex-1">
                <p className="text-xl font-semibold truncate max-w-xs sm:max-w-none">
                  {song.song}
                </p>
                {song.tip > 0 ? (
                  <span className="text-green-300 font-semibold text-lg">
                    💸 Propina: {song.tip} €
                  </span>
                ) : (
                  <span className="text-blue-300 font-semibold text-lg">
                    👍 Votos: {song.votes}
                  </span>
                )}
              </div>

              <div className="flex gap-3 mt-3 sm:mt-0">
                {onPlay && (
                  <button
                    onClick={() => onPlay(song.id)}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg shadow-md font-semibold transition"
                    title={`Reproducir ${song.song}`}
                  >
                    ▶ Reproducir
                  </button>
                )}
                {onMarkAsPlayed && (
                  <button
                    onClick={() => onMarkAsPlayed(song.id)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-800 rounded-lg shadow-md font-semibold transition"
                    title={`Marcar ${song.song} como tocada`}
                  >
                    ✔ Tocada
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DJPanel;

