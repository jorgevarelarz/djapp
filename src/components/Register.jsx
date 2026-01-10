import React, { useState } from "react";

export default function Register({ onRegisterSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user"); // Por defecto cliente (user)
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:4000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error en el registro");
      } else {
        onRegisterSuccess();
      }
    } catch (err) {
      setError("Error de conexión al servidor");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 bg-white rounded shadow space-y-4">
      <h2 className="text-xl font-semibold">Registro</h2>

      <input
        type="text"
        placeholder="Usuario"
        className="w-full border px-3 py-2 rounded"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Contraseña"
        className="w-full border px-3 py-2 rounded"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full border px-3 py-2 rounded">
        <option value="user">Cliente</option>
        <option value="dj">DJ</option>
      </select>

      {error && <p className="text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-2 rounded text-white ${
          loading ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800"
        }`}
      >
        {loading ? "Registrando..." : "Registrar"}
      </button>
    </form>
  );
}

