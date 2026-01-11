import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { API_URL, apiFetch } from "../config";

const STORAGE_KEY_USER = "dj-app-user";
const STORAGE_KEY_EVENT = "dj-app-event";
const STORAGE_KEY_JOIN_CODE = "dj-app-join-code";
const STORAGE_KEY_DEVICE = "dj-app-device-id";
const STORAGE_KEY_NICKNAME = "dj-app-nickname";

const REQUEST_POLL_MS = 4000;

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [event, setEvent] = useState(null);
  const [requests, setRequests] = useState([]);
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

  const value = {
    user,
    event,
    eventName,
    setEventName,
    error,
    joinCode,
    setJoinCode,
    nickname,
    setNickname,
    requestNotice,
    requestError,
    setRequestError,
    setRequestNotice,
    djNotice,
    djError,
    loadingRequests,
    sortedRequests,
    handleLoginSuccess,
    handleLogout,
    handleCreateEvent,
    handleCreateRequest,
    playSong,
    markAsPlayed,
    handleBanDevice,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
}
