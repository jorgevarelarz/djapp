import React, { useEffect, useRef, useState } from "react";
import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import SongRequestForm from "./components/SongRequestForm";
import DJPanel from "./components/DJPanel";
import { API_URL, apiFetch } from "./config";

const STORAGE_KEY_USER = "dj-app-user";
const STORAGE_KEY_EVENT = "dj-app-event";
const STORAGE_KEY_JOIN_CODE = "dj-app-join-code";
const STORAGE_KEY_DEVICE = "dj-app-device-id";
const STORAGE_KEY_NICKNAME = "dj-app-nickname";

const REQUEST_POLL_MS = 4000;

export default function App() {
  const [user, setUser] = useState(null);
  const [event, setEvent] = useState(null);
  const [requests, setRequests] = useState([]);
  const [showRegister, setShowRegister] = useState(false);
  const [error, setError] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [nickname, setNickname] = useState("");
  const [eventName, setEventName] = useState("");
  const [requestNotice, setRequestNotice] = useState("");
  const [requestError, setRequestError] = useState("");
  const [djNotice, setDjNotice] = useState("");
  const [djError, setDjError] = useState("");
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const requestInFlightRef = useRef(false);

  useEffect(() => {
    const savedUser = localStorage.getItem(STORAGE_KEY_USER);
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(null);
      }
    }

    const savedEvent = localStorage.getItem(STORAGE_KEY_EVENT);
    if (savedEvent) {
      try {
        setEvent(JSON.parse(savedEvent));
      } catch {
        setEvent(null);
      }
    }

    const savedJoinCode = localStorage.getItem(STORAGE_KEY_JOIN_CODE);
    if (savedJoinCode) {
      setJoinCode(savedJoinCode);
    }

    const savedDeviceId = localStorage.getItem(STORAGE_KEY_DEVICE);
    if (savedDeviceId) {
      setDeviceId(savedDeviceId);
    } else {
      const newDeviceId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      localStorage.setItem(STORAGE_KEY_DEVICE, newDeviceId);
      setDeviceId(newDeviceId);
    }

    const savedNickname = localStorage.getItem(STORAGE_KEY_NICKNAME);
    if (savedNickname) {
      setNickname(savedNickname);
    }
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY_USER);
  }, [user]);

  useEffect(() => {
    if (event) localStorage.setItem(STORAGE_KEY_EVENT, JSON.stringify(event));
    else localStorage.removeItem(STORAGE_KEY_EVENT);
  }, [event]);

  useEffect(() => {
    if (joinCode) localStorage.setItem(STORAGE_KEY_JOIN_CODE, joinCode);
    else localStorage.removeItem(STORAGE_KEY_JOIN_CODE);
  }, [joinCode]);

  useEffect(() => {
    if (nickname) localStorage.setItem(STORAGE_KEY_NICKNAME, nickname);
    else localStorage.removeItem(STORAGE_KEY_NICKNAME);
  }, [nickname]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY_USER) {
        try {
          const newUser = JSON.parse(e.newValue);
          setUser(newUser || null);
        } catch {}
      }
      if (e.key === STORAGE_KEY_EVENT) {
        try {
          const newEvent = JSON.parse(e.newValue);
          setEvent(newEvent || null);
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleLoginSuccess = (data) => {
    setError("");
    setUser(data);
    if (data.role !== "DJ") {
      setEvent(null);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setEvent(null);
    setRequests([]);
    setJoinCode("");
    setError("");
    setLastSync(null);
    setDjNotice("");
    setDjError("");
  };

  const handleAuthFailure = (message) => {
    setUser(null);
    setEvent(null);
    setRequests([]);
    setJoinCode("");
    setLastSync(null);
    setError(message || "Sesion expirada. Inicia sesion de nuevo.");
    setDjNotice("");
    setDjError("");
  };

  const authMessageFor = (res, data) => {
    if (res.status === 401) {
      if (data?.code === "AUTH_EXPIRED") {
        return "Sesion caducada. Inicia sesion de nuevo.";
      }
      if (data?.code === "AUTH_INVALID") {
        return "Sesion invalida. Inicia sesion de nuevo.";
      }
      return "Sesion caducada. Inicia sesion de nuevo.";
    }
    if (res.status === 403 && data?.code === "FORBIDDEN_ROLE") {
      return "No tienes permisos de DJ para esta accion.";
    }
    return "Sesion caducada. Inicia sesion de nuevo.";
  };

  const handleAuthResponse = (res, data) => {
    if (res.status === 401 || res.status === 403) {
      handleAuthFailure(authMessageFor(res, data));
      return true;
    }
    return false;
  };

  const authHeaders = user
    ? { Authorization: `Bearer ${user.token}` }
    : {};

  const loadEventsForDj = async () => {
    if (!user || user.role !== "DJ") return;
    try {
      const { res, data } = await apiFetch(`${API_URL}/api/dj/events`, {
        headers: { ...authHeaders },
      });
      if (handleAuthResponse(res, data)) return;
      if (!res.ok) {
        return;
      }
      const activeEvent =
        data.events.find((item) => item.status === "active") || data.events[0];
      if (activeEvent) {
        setEvent(activeEvent);
      }
    } catch {}
  };

  const loadRequests = async () => {
    if (!user || user.role !== "DJ" || !event) return;
    if (requestInFlightRef.current) return;
    requestInFlightRef.current = true;
    setLoadingRequests(true);
    try {
      const sinceParam = Number.isFinite(lastSync) ? `?since=${lastSync}` : "";
      const { res, data } = await apiFetch(
        `${API_URL}/api/dj/events/${event.id}/requests${sinceParam}`,
        {
          headers: { ...authHeaders },
        }
      );
      if (handleAuthResponse(res, data)) return;
      if (res.ok) {
        const incoming = data.requests || [];
        if (Number.isFinite(data.serverTime)) {
          setLastSync(data.serverTime);
        }
        if (!sinceParam) {
          setRequests(incoming);
        } else if (incoming.length) {
          setRequests((prev) => {
            const nextMap = new Map(prev.map((item) => [item.id, item]));
            incoming.forEach((item) => {
              nextMap.set(item.id, item);
            });
            return Array.from(nextMap.values());
          });
        }
      }
    } catch {}
    finally {
      requestInFlightRef.current = false;
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "DJ" && !event) {
      loadEventsForDj();
    }
  }, [user, event]);

  useEffect(() => {
    if (!user || user.role !== "DJ" || !event) return;
    loadRequests();
    const interval = setInterval(loadRequests, REQUEST_POLL_MS);
    return () => clearInterval(interval);
  }, [user, event?.id]);

  useEffect(() => {
    setRequests([]);
    setLastSync(null);
    setDjNotice("");
    setDjError("");
  }, [event?.id]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!eventName.trim()) return;
    setError("");
    try {
      const { res, data } = await apiFetch(`${API_URL}/api/dj/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ name: eventName }),
      });
      if (handleAuthResponse(res, data)) return;
      if (!res.ok) {
        setError(data?.error || "No se pudo crear el evento");
        return;
      }
      setEvent(data.event);
      setEventName("");
    } catch {
      setError("Error de conexión con el servidor");
    }
  };

  const handleCreateRequest = async ({
    songTitle,
    artist,
    message,
    tipAmount,
  }) => {
    if (!joinCode.trim()) {
      setRequestError("Ingresa un codigo de evento");
      return;
    }
    setRequestError("");
    setRequestNotice("");

    try {
      const { res, data } = await apiFetch(
        `${API_URL}/api/public/events/${joinCode.trim().toUpperCase()}/requests`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-device-id": deviceId,
          },
          body: JSON.stringify({
            songTitle,
            artist,
            message,
            nickname,
            deviceHash: deviceId,
            tipAmount,
          }),
        }
      );
      if (!res.ok) {
        if (data?.code === "COOLDOWN" && data.retryAfterSeconds) {
          setRequestError(
            `Espera ${data.retryAfterSeconds} segundos para volver a pedir.`
          );
        } else if (data?.code === "MAX_REQUESTS_PER_DEVICE") {
          setRequestError(
            "Has alcanzado el limite de peticiones para este evento."
          );
        } else if (data?.code === "DEVICE_BANNED") {
          setRequestError("Tu dispositivo esta bloqueado para este evento.");
        } else if (data?.code === "EVENT_NOT_FOUND") {
          setRequestError("Codigo de evento invalido.");
        } else if (data?.code === "EVENT_ENDED") {
          setRequestError("Este evento ya finalizo.");
        } else {
          setRequestError(data?.error || "No se pudo enviar la solicitud");
        }
        return;
      }
      setRequestNotice("Solicitud enviada");
    } catch {
      setRequestError("Error de conexión con el servidor");
    }
  };

  const updateRequestStatus = async (id, status) => {
    if (!event) return;
    try {
      const { res, data } = await apiFetch(`${API_URL}/api/dj/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ status }),
      });
      if (handleAuthResponse(res, data)) return;
      if (res.ok) {
        loadRequests();
      }
    } catch {}
  };

  const handleBanDevice = async (deviceHash) => {
    if (!event || !deviceHash) return;
    const confirmed = window.confirm("¿Bloquear este dispositivo?");
    if (!confirmed) return;
    setDjError("");
    setDjNotice("");
    try {
      const { res, data } = await apiFetch(
        `${API_URL}/api/dj/events/${event.id}/ban-device`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ deviceHash }),
        }
      );
      if (handleAuthResponse(res, data)) return;
      if (!res.ok) {
        setDjError(data?.error || "No se pudo bloquear el dispositivo");
        return;
      }
      setDjNotice("Dispositivo bloqueado");
      loadRequests();
    } catch {
      setDjError("Error de conexión con el servidor");
    }
  };

  const playSong = (id) => updateRequestStatus(id, "playing");
  const markAsPlayed = (id) => updateRequestStatus(id, "done");

  const visibleRequests = requests.filter((request) => request.status !== "done");
  const sortedRequests = [...visibleRequests].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  const Landing = () => {
    const navigate = useNavigate();

    const handleGuestStart = (e) => {
      e.preventDefault();
      if (!joinCode.trim()) {
        setRequestError("Ingresa un codigo de evento");
        return;
      }
      setRequestError("");
      navigate(`/event/${joinCode.trim().toUpperCase()}`);
    };

    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-16">
        <div className="max-w-4xl w-full grid gap-10 lg:grid-cols-[1.05fr_0.95fr] items-center">
          <div className="space-y-6 bb-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/70">
              BeatBid Live
            </span>
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl font-semibold bb-title">
                La cabina entiende tus pedidos.
              </h1>
              <p className="text-white/70 text-lg">
                Entra con el codigo del evento, deja tu apodo y manda la
                cancion. Sin cuentas ni fricciones.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-white/60">
              <span>✔️ Cola en tiempo real</span>
              <span>✔️ Propinas destacadas</span>
              <span>✔️ Anti-spam listo</span>
            </div>
          </div>

          <div className="bb-card-strong rounded-2xl p-6 shadow-2xl bb-fade-up">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-semibold bb-title">Entrar como invitado</h2>
              <p className="text-white/60">Solo necesitas el codigo del evento.</p>
            </div>

            <form onSubmit={handleGuestStart} className="mt-6 space-y-4">
              <label className="block text-sm font-semibold text-white/70">
                Codigo del evento
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
              />
              {requestError && (
                <p className="text-red-300 text-sm">{requestError}</p>
              )}
              <button
                type="submit"
                className="w-full rounded-lg bg-gradient-to-r from-emerald-300 to-amber-300 py-2 font-semibold text-slate-900 shadow-[0_12px_30px_rgba(53,208,186,0.3)] transition hover:opacity-90"
              >
                Pedir cancion
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-white/60">
              ¿Eres DJ?{" "}
              <Link to="/dj" className="text-emerald-200 underline">
                Acceder
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const GuestEvent = () => {
    const { joinCode: joinCodeParam } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
      if (joinCodeParam) {
        setJoinCode(joinCodeParam.toUpperCase());
      }
      setRequestNotice("");
      setRequestError("");
    }, [joinCodeParam]);

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
            <Link to="/" className="underline">Volver</Link>
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
  };

  const DjArea = () => {
    if (!user) {
      return (
        <div className="min-h-screen px-6 py-12">
          {showRegister ? (
            <>
              <Register onRegisterSuccess={() => setShowRegister(false)} />
              <p className="text-center mt-4">
                ¿Ya tienes cuenta?{" "}
                <button
                  className="text-emerald-200 underline"
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
                <p className="text-red-300 text-center mt-2">{error}</p>
              )}
              <p className="text-center mt-4">
                ¿No tienes cuenta?{" "}
                <button
                  className="text-emerald-200 underline"
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

    if (user.role !== "DJ") {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="bb-card rounded-xl p-6 text-center space-y-4">
            <p>No tienes permisos de DJ.</p>
            <button
              className="rounded-lg bg-red-500/20 px-4 py-2 text-red-100"
              onClick={handleLogout}
            >
              Salir
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen px-6 py-10">
        <div className="flex items-center justify-between mb-6 text-sm text-white/70">
          <Link to="/" className="underline">
            Volver
          </Link>
          <button
            className="rounded-lg border border-red-400/40 px-4 py-2 text-red-200 transition hover:bg-red-500/20"
            onClick={handleLogout}
          >
            Cerrar sesión ({user.email})
          </button>
        </div>

        <div className="space-y-6">
          {!event ? (
            <form
              onSubmit={handleCreateEvent}
              className="max-w-md mx-auto p-6 rounded-2xl space-y-4 bb-card"
            >
              <h2 className="text-xl font-semibold">Crear evento</h2>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Nombre del evento"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
              />
              {error && <p className="text-red-300">{error}</p>}
              <button
                type="submit"
                className="w-full rounded-lg bg-gradient-to-r from-emerald-300 to-amber-300 py-2 font-semibold text-slate-900 shadow-[0_12px_30px_rgba(53,208,186,0.25)] transition hover:opacity-90"
              >
                Crear evento
              </button>
            </form>
          ) : (
            <div className="max-w-3xl mx-auto rounded-2xl p-5 text-center bb-card">
              <p className="text-sm text-white/60">Evento activo</p>
              <h3 className="text-2xl font-semibold">{event.name}</h3>
              <p className="mt-2">
                Codigo para el publico:{" "}
                <span className="font-bold text-lg text-emerald-200">
                  {event.joinCode}
                </span>
              </p>
              {loadingRequests && (
                <p className="text-sm text-white/60 mt-2">
                  Actualizando solicitudes...
                </p>
              )}
            </div>
          )}

          {djNotice && (
            <p className="text-emerald-200 text-center">{djNotice}</p>
          )}
          {djError && <p className="text-red-300 text-center">{djError}</p>}

          {event && (
            <DJPanel
              requests={sortedRequests}
              onPlay={playSong}
              onMarkAsPlayed={markAsPlayed}
              onBanDevice={handleBanDevice}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/event/:joinCode" element={<GuestEvent />} />
      <Route path="/dj" element={<DjArea />} />
    </Routes>
  );
}
