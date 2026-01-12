import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDjContext } from "../context/DjContext";

export default function Landing() {
  const navigate = useNavigate();
  const { joinCode, setJoinCode, requestError } = useDjContext();

  const normalized = useMemo(
    () => joinCode.trim().toUpperCase().replace(/\s+/g, ""),
    [joinCode]
  );

  const canEnter = normalized.length >= 4;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEnter) return;
    navigate(`/event/${normalized}`);
  };

  return (
    <div className="page-shell">
      <div className="container py-12">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
            THE PARTY REMOTE
          </p>
          <h1 className="text-4xl font-bold text-gray-900">
            Pide canciones sin gritar.
          </h1>
          <p className="text-base text-gray-500">
            Conecta al público con el DJ en segundos. Peticiones, votos y tips
            opcionales.
          </p>

          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            <input
              className="input text-center text-lg font-semibold tracking-widest"
              placeholder="Código del evento"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              autoCapitalize="characters"
            />
            <button className="btn-primary w-full" disabled={!canEnter}>
              Entrar
            </button>
            {requestError && (
              <p className="text-sm text-red-600">{requestError}</p>
            )}
            <p className="text-xs text-gray-500">
              Sin apps · Sin registro · Tips opcionales
            </p>
          </form>

          <div>
            <button className="btn-secondary" onClick={() => navigate("/dj")}>
              Soy DJ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
