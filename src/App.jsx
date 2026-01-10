import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import SongRequestForm from "./components/SongRequestForm";
import SongList from "./components/SongList";
import DJPanel from "./components/DJPanel";

const STORAGE_KEY_SONGS = "dj-app-songs";
const STORAGE_KEY_USER = "dj-app-user";

export default function App() {
  const [user, setUser] = useState(null);
  const [songs, setSongs] = useState([]);
  const [showRegister, setShowRegister] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Cargar canciones y usuario de localStorage
    const savedSongs = localStorage.getItem(STORAGE_KEY_SONGS);
    if (savedSongs) {
      try {
        setSongs(JSON.parse(savedSongs));
      } catch {
        setSongs([]);
      }
    }
    const savedUser = localStorage.getItem(STORAGE_KEY_USER);
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SONGS, JSON.stringify(songs));
  }, [songs]);

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY_USER);
  }, [user]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY_SONGS) {
        try {
          const newSongs = JSON.parse(e.newValue);
          setSongs(newSongs || []);
        } catch {}
      }
      if (e.key === STORAGE_KEY_USER) {
        try {
          const newUser = JSON.parse(e.newValue);
          setUser(newUser || null);
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleLoginSuccess = (data) => {
    // data viene del backend: { token, username, role }
    setError("");
    setUser(data);
  };

  const handleLogout = () => {
    setUser(null);
    setSongs([]);
  };

  const addSong = (newSong) => {
    setSongs((prev) => [...prev, newSong]);
  };

  const voteSong = (id) => {
    setSongs((prev) =>
      prev.map((song) =>
        song.id === id ? { ...song, votes: song.votes + 1 } : song
      )
    );
  };

  const markAsPlayed = (id) => {
    setSongs((prev) => prev.filter((song) => song.id !== id));
  };

  const playSong = (id) => {
    alert(`Reproduciendo canción ID ${id}`);
  };

  const sortedSongs = [...songs].sort((a, b) => {
    if (b.tip !== a.tip) return b.tip - a.tip;
    return b.votes - a.votes;
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        {showRegister ? (
          <>
            <Register onRegisterSuccess={() => setShowRegister(false)} />
            <p className="text-center mt-4">
              ¿Ya tienes cuenta?{" "}
              <button
                className="text-blue-600 underline"
                onClick={() => setShowRegister(false)}
              >
                Iniciar sesión
              </button>
            </p>
          </>
        ) : (
          <>
            <Login onLoginSuccess={handleLoginSuccess} />
            {error && (
              <p className="text-red-600 text-center mt-2">{error}</p>
            )}
            <p className="text-center mt-4">
              ¿No tienes cuenta?{" "}
              <button
                className="text-blue-600 underline"
                onClick={() => setShowRegister(true)}
              >
                Regístrate
              </button>
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="flex justify-end mb-4">
        <button
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          onClick={handleLogout}
        >
          Cerrar sesión ({user.username})
        </button>
      </div>

      {user.role === "user" ? (
        <>
          <SongRequestForm onAddRequest={addSong} />
          <SongList songs={sortedSongs} onVote={voteSong} />
        </>
      ) : (
        <DJPanel
          songs={sortedSongs}
          onPlay={playSong}
          onMarkAsPlayed={markAsPlayed}
        />
      )}
    </div>
  );
}

