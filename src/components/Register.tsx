import React, { useState } from "react";
import { useDjContext } from "../context/DjContext";

export default function Register() {
  const { register, djError, djNotice } = useDjContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await register(email, password, inviteCode);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          className="input mt-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Contraseña
        </label>
        <input
          className="input mt-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Código DJ (opcional)
        </label>
        <input
          className="input mt-2"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          type="text"
        />
      </div>
      {djNotice && <p className="text-sm text-green-600">{djNotice}</p>}
      {djError && <p className="text-sm text-red-600">{djError}</p>}
      <button className="btn-primary w-full" type="submit" disabled={loading}>
        {loading ? "Creando..." : "Crear cuenta"}
      </button>
    </form>
  );
}
