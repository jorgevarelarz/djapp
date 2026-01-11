import React, { useState } from "react";
import { API_URL, apiFetch } from "../config";

export default function Register({ onRegisterSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { res, data } = await apiFetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, inviteCode }),
      });

      if (!res.ok) {
        setError(data?.error || "Error en el registro");
      } else {
        onRegisterSuccess();
      }
    } catch (err) {
      setError("Error de conexión al servidor");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 rounded-2xl space-y-4 bb-card">
      <div className="space-y-1 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">
          Nuevo DJ
        </p>
        <h2 className="text-xl font-semibold bb-title">Registro</h2>
      </div>

      <input
        type="email"
        placeholder="Email"
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Contraseña"
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <input
        type="text"
        placeholder="Codigo DJ (opcional)"
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
        value={inviteCode}
        onChange={(e) => setInviteCode(e.target.value)}
      />

      {error && <p className="text-red-300">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-2 rounded-lg font-semibold text-slate-900 ${
          loading
            ? "bg-white/20 text-white cursor-not-allowed"
            : "bg-gradient-to-r from-emerald-300 to-amber-300 hover:opacity-90"
        }`}
      >
        {loading ? "Registrando..." : "Registrar"}
      </button>
    </form>
  );
}
