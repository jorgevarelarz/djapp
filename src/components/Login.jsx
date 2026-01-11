import React, { useState } from "react";
import { API_URL, apiFetch } from "../config";

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Por favor, completa todos los campos");
      return;
    }

    try {
      const { res, data } = await apiFetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setError(data?.error || "Error en el login");
      } else {
        onLoginSuccess(data);
      }
    } catch (err) {
      setError("Error de conexión con el servidor");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-sm mx-auto p-6 rounded-2xl space-y-4 bb-card"
    >
      <div className="space-y-1 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">
          Acceso DJ
        </p>
        <h2 className="text-2xl font-semibold bb-title">Iniciar sesión</h2>
      </div>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
        required
      />

      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
        required
      />

      {error && <p className="text-red-300 text-center">{error}</p>}

      <button
        type="submit"
        className="w-full rounded-lg bg-gradient-to-r from-emerald-300 to-amber-300 py-2 font-semibold text-slate-900 shadow-[0_12px_30px_rgba(53,208,186,0.25)] transition hover:opacity-90"
      >
        Entrar
      </button>
    </form>
  );
}
