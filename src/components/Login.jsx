import React, { useState } from "react";

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Por favor, completa todos los campos");
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error en el login");
      } else {
        // Verificamos que el rol coincide
        if (data.role !== role) {
          setError(`El usuario no tiene rol de ${role}`);
          return;
        }
        onLoginSuccess(data);
      }
    } catch (err) {
      setError("Error de conexión con el servidor");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-sm mx-auto p-6 bg-white rounded-lg shadow-md space-y-4"
    >
      <h2 className="text-2xl font-semibold text-center">Iniciar sesión</h2>

      <input
        type="text"
        placeholder="Usuario"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full border px-3 py-2 rounded"
        required
      />

      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full border px-3 py-2 rounded"
        required
      />

      <div className="flex justify-center gap-6">
        <label>
          <input
            type="radio"
            name="role"
            value="user"
            checked={role === "user"}
            onChange={() => setRole("user")}
          />
          <span className="ml-2">Cliente</span>
        </label>

        <label>
          <input
            type="radio"
            name="role"
            value="dj"
            checked={role === "dj"}
            onChange={() => setRole("dj")}
          />
          <span className="ml-2">DJ</span>
        </label>
      </div>

      {error && <p className="text-red-600 text-center">{error}</p>}

      <button
        type="submit"
        className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition"
      >
        Entrar
      </button>
    </form>
  );
}

