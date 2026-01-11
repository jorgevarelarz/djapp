import React, { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import SongRequestForm from "../components/SongRequestForm";
import { useAppContext } from "../context/AppContext";

export default function GuestEvent() {
  const {
    joinCode,
    setJoinCode,
    nickname,
    setNickname,
    requestNotice,
    requestError,
    setRequestNotice,
    setRequestError,
    handleCreateRequest,
  } = useAppContext();
  const { joinCode: joinCodeParam } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (joinCodeParam) {
      setJoinCode(joinCodeParam.toUpperCase());
    }
    setRequestNotice("");
    setRequestError("");
  }, [joinCodeParam, setJoinCode, setRequestNotice, setRequestError]);

  const handleJoinCodeSubmit = (e) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setRequestError("Ingresa un codigo de evento");
      return;
    }
    setRequestError("");
    navigate(`/event/${joinCode.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between text-sm text-white/70">
          <Link to="/" className="underline">
            Volver
          </Link>
          <span>Invitado</span>
        </div>

        <div className="bb-card rounded-2xl p-5 shadow space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold bb-title">Tu evento</h2>
            <span className="text-xs uppercase tracking-[0.3em] text-white/60">
              #{joinCode || "--"}
            </span>
          </div>
          <form onSubmit={handleJoinCodeSubmit} className="space-y-2">
            <label className="block text-sm font-semibold text-white/70">
              Codigo
            </label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
            />
            <button
              type="submit"
              className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white/70 transition hover:border-white/30 hover:text-white"
            >
              Cambiar codigo
            </button>
          </form>
        </div>

        <div className="bb-card rounded-2xl p-5 shadow space-y-3">
          <label className="block text-sm font-semibold text-white/70">
            Apodo (opcional)
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Tu nombre"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
            maxLength={40}
          />
        </div>

        <SongRequestForm onAddRequest={handleCreateRequest} />

        {requestNotice && (
          <p className="text-emerald-200 text-center">{requestNotice}</p>
        )}
        {requestError && (
          <p className="text-red-300 text-center">{requestError}</p>
        )}
      </div>
    </div>
  );
}
