import React, { useState } from "react";
import { ArrowRight, Key, Loader2, Lock, User } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
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
        const message = data?.error || "Error en el registro";
        setError(message);
        toast.error(message);
      } else {
        toast.success("Cuenta creada correctamente");
        onRegisterSuccess();
      }
    } catch (err) {
      const message = "No se pudo conectar con el servidor";
      setError(message);
      toast.error(message);
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center w-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md card-vercel p-8 rounded-2xl"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-white">
            Nueva Cuenta DJ
          </h2>
          <p className="text-white/60 text-sm mt-1">
            Únete a la plataforma BeatBid
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative group">
            <User className="absolute left-4 top-3.5 w-5 h-5 text-white/40 group-focus-within:text-white transition-colors" />
            <input
              type="email"
              placeholder="Email"
              className="input-vercel h-11 pl-11 text-white placeholder:text-white/40"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-white/40 group-focus-within:text-white transition-colors" />
            <input
              type="password"
              placeholder="Contraseña"
              className="input-vercel h-11 pl-11 text-white placeholder:text-white/40"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="relative group">
            <Key className="absolute left-4 top-3.5 w-5 h-5 text-white/40 group-focus-within:text-white transition-colors" />
            <input
              type="text"
              placeholder="Código de Invitación (Opcional)"
              className="input-vercel h-11 pl-11 text-white placeholder:text-white/40"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
            />
          </div>

          {error && <p className="text-red-300 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full h-11 mt-4"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Registrar <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
