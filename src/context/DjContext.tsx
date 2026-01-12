import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { API_URL } from "../config";

type User = {
  token: string;
  email: string;
  role: string;
  isAdmin?: boolean;
};

type Event = {
  id: number;
  name: string;
  joinCode: string;
  status: string;
  spotifyPlaylistId?: string | null;
  spotifyPlaylistName?: string | null;
};

export type RequestItem = {
  id: number;
  songTitle: string;
  artist?: string | null;
  message?: string | null;
  nickname?: string | null;
  status: string;
  priority: number;
  tipAmount: number;
  deviceHash?: string | null;
  createdAt?: string;
  updatedAt?: number;
  paymentStatus?: string | null;
  paymentAmountCents?: number | null;
};

type SpotifyPlaylist = {
  id: string;
  name: string;
  tracksTotal: number;
  image?: string | null;
};

type DjContextValue = {
  user: User | null;
  event: Event | null;
  eventName: string;
  setEventName: (value: string) => void;
  eventError: string;
  joinCode: string;
  nickname: string;
  requestNotice: string;
  requestError: string;
  djNotice: string;
  djError: string;
  sortedRequests: RequestItem[];
  loadingRequests: boolean;
  pendingPayment: {
    clientSecret: string;
    requestId: number;
    amountCents: number;
  } | null;
  playlistTracks: {
    trackId: string;
    name: string;
    artists: string;
    image?: string | null;
    votes: number;
  }[];
  playlistName: string;
  playlistLoading: boolean;
  playlistError: string;
  voteNotice: string;
  voteError: string;
  voteCooldownUntil: number | null;
  spotifyConnected: boolean;
  spotifyPlaylists: SpotifyPlaylist[];
  spotifyLoading: boolean;
  spotifyError: string;
  setJoinCode: (value: string) => void;
  setNickname: (value: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, inviteCode?: string) => Promise<void>;
  logout: () => void;
  createEvent: (name: string) => Promise<void>;
  createRequest: (payload: {
    songTitle: string;
    artist?: string | null;
    message?: string | null;
    tipAmount: number;
  }) => Promise<void>;
  playSong: (id: number) => Promise<void>;
  markAsPlayed: (id: number) => Promise<void>;
  acceptRequest: (id: number) => Promise<void>;
  rejectRequest: (id: number) => Promise<void>;
  banDevice: (deviceHash?: string | null) => Promise<void>;
  confirmPayment: (requestId: number, paymentIntentId: string) => Promise<void>;
  connectSpotify: () => Promise<void>;
  loadSpotifyPlaylists: () => Promise<void>;
  setEventPlaylist: (playlistId: string) => Promise<void>;
  loadPublicPlaylist: (joinCode: string) => Promise<void>;
  voteTrack: (trackId: string) => Promise<void>;
  disconnectSpotify: () => Promise<void>;
};

const DjContext = createContext<DjContextValue | null>(null);

const STORAGE_USER = "dj-app-user";
const STORAGE_EVENT = "dj-app-event";
const STORAGE_JOIN = "dj-app-join-code";
const STORAGE_DEVICE = "dj-app-device-id";
const STORAGE_NICK = "dj-app-nickname";
const STORAGE_VOTE_COOLDOWN = "dj-app-vote-cooldown";

const REQUEST_POLL_MS = 4000;

async function apiFetch(url: string, options?: RequestInit) {
  if (!url || url.includes("undefined")) {
    throw new Error("API_URL no configurada");
  }
  const res = await fetch(url, options);
  let data: any = null;
  try {
    data = await res.json();
  } catch {}
  return { res, data };
}

export function DjProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [eventName, setEventName] = useState("");
  const [eventError, setEventError] = useState("");
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [joinCode, setJoinCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [requestNotice, setRequestNotice] = useState("");
  const [requestError, setRequestError] = useState("");
  const [djNotice, setDjNotice] = useState("");
  const [djError, setDjError] = useState("");
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<{
    clientSecret: string;
    requestId: number;
    amountCents: number;
  } | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<
    {
      trackId: string;
      name: string;
      artists: string;
      image?: string | null;
      votes: number;
    }[]
  >([]);
  const [playlistName, setPlaylistName] = useState("");
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [playlistError, setPlaylistError] = useState("");
  const [voteNotice, setVoteNotice] = useState("");
  const [voteError, setVoteError] = useState("");
  const [voteCooldownUntil, setVoteCooldownUntil] = useState<number | null>(null);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [spotifyPlaylists, setSpotifyPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [spotifyError, setSpotifyError] = useState("");
  const [lastSync, setLastSync] = useState<number | null>(null);
  const requestInFlight = useRef(false);
  const deviceRef = useRef("");

  useEffect(() => {
    const savedUser = localStorage.getItem(STORAGE_USER);
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {}
    }
    const savedEvent = localStorage.getItem(STORAGE_EVENT);
    if (savedEvent) {
      try {
        setEvent(JSON.parse(savedEvent));
      } catch {}
    }
    const savedJoin = localStorage.getItem(STORAGE_JOIN);
    if (savedJoin) setJoinCode(savedJoin);
    const savedNick = localStorage.getItem(STORAGE_NICK);
    if (savedNick) setNickname(savedNick);
    const savedDevice = localStorage.getItem(STORAGE_DEVICE);
    if (savedDevice) {
      deviceRef.current = savedDevice;
    } else {
      const newDevice =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      localStorage.setItem(STORAGE_DEVICE, newDevice);
      deviceRef.current = newDevice;
    }
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_USER, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_USER);
  }, [user]);

  useEffect(() => {
    if (event) localStorage.setItem(STORAGE_EVENT, JSON.stringify(event));
    else localStorage.removeItem(STORAGE_EVENT);
  }, [event]);

  useEffect(() => {
    if (joinCode) localStorage.setItem(STORAGE_JOIN, joinCode);
    else localStorage.removeItem(STORAGE_JOIN);
  }, [joinCode]);

  useEffect(() => {
    if (nickname) localStorage.setItem(STORAGE_NICK, nickname);
    else localStorage.removeItem(STORAGE_NICK);
  }, [nickname]);

  useEffect(() => {
    if (!joinCode) {
      setVoteCooldownUntil(null);
      return;
    }
    const saved = localStorage.getItem(`${STORAGE_VOTE_COOLDOWN}-${joinCode}`);
    if (saved) {
      const parsed = Number(saved);
      if (Number.isFinite(parsed)) {
        setVoteCooldownUntil(parsed);
        return;
      }
    }
    setVoteCooldownUntil(null);
  }, [joinCode]);

  const withAuth = useCallback(
    (base: Record<string, string> = {}) => {
      const headers = new Headers(base);
      if (user?.token) {
        headers.set("Authorization", `Bearer ${user.token}`);
      }
      return headers;
    },
    [user?.token]
  );

  const login = async (email: string, password: string) => {
    setDjError("");
    setEventError("");
    const { res, data } = await apiFetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: withAuth({ "Content-Type": "application/json" }),
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      setDjError(data?.error || "Credenciales invalidas");
      return;
    }
    setUser(data);
  };

  const register = async (
    email: string,
    password: string,
    inviteCode?: string
  ) => {
    setDjError("");
    setEventError("");
    const { res, data } = await apiFetch(`${API_URL}/api/register`, {
      method: "POST",
      headers: withAuth({ "Content-Type": "application/json" }),
      body: JSON.stringify({ email, password, inviteCode }),
    });
    if (!res.ok) {
      setDjError(data?.error || "No se pudo registrar");
      return;
    }
    setDjNotice("Cuenta creada");
  };

  const logout = () => {
    setUser(null);
    setEvent(null);
    setEventName("");
    setEventError("");
    setRequests([]);
    setJoinCode("");
    setNickname("");
    setRequestNotice("");
    setRequestError("");
    setDjNotice("");
    setDjError("");
    setLastSync(null);
    setPendingPayment(null);
    setSpotifyConnected(false);
    setSpotifyPlaylists([]);
    setSpotifyLoading(false);
    setSpotifyError("");
    setPlaylistTracks([]);
    setPlaylistName("");
    setPlaylistLoading(false);
    setPlaylistError("");
    setVoteNotice("");
    setVoteError("");
    setVoteCooldownUntil(null);
  };

  const loadEvents = useCallback(async () => {
    if (!user) return;
    const { res, data } = await apiFetch(`${API_URL}/api/dj/events`, {
      headers: withAuth(),
    });
    if (!res.ok) return;
    const active =
      data.events.find((item: Event) => item.status === "active") ||
      data.events[0];
    if (active) setEvent(active);
  }, [user, withAuth]);

  const createEvent = async (name: string) => {
    setDjError("");
    setEventError("");
    try {
      const { res, data } = await apiFetch(`${API_URL}/api/dj/events`, {
        method: "POST",
        headers: withAuth({ "Content-Type": "application/json" }),
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        setEventError(data?.error || "No se pudo crear el evento");
        return;
      }
      setEvent(data.event);
    } catch {
      setEventError("Error de conexión con el servidor");
    }
  };

  const setEventPlaylist = async (playlistId: string) => {
    if (!event) return;
    setDjError("");
    setDjNotice("");
    try {
      const { res, data } = await apiFetch(
        `${API_URL}/api/dj/events/${event.id}/playlist`,
        {
          method: "POST",
          headers: withAuth({ "Content-Type": "application/json" }),
          body: JSON.stringify({ playlistId }),
        }
      );
      if (!res.ok) {
        setDjError(data?.error || "No se pudo guardar la playlist");
        return;
      }
      if (data?.event) {
        setEvent(data.event);
        setDjNotice("Playlist guardada");
      }
    } catch {
      setDjError("Error de conexión con el servidor");
    }
  };

  const loadRequests = useCallback(async () => {
    if (!user || user.role !== "DJ" || !event) return;
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setLoadingRequests(true);
    try {
      const sinceParam = Number.isFinite(lastSync) ? `?since=${lastSync}` : "";
      const { res, data } = await apiFetch(
        `${API_URL}/api/dj/events/${event.id}/requests${sinceParam}`,
        { headers: withAuth() }
      );
      if (res.ok) {
        const incoming = data.requests || [];
        if (Number.isFinite(data.serverTime)) {
          setLastSync(data.serverTime);
        }
        if (!sinceParam) {
          setRequests(incoming);
        } else if (incoming.length) {
          setRequests((prev) => {
            const map = new Map(prev.map((item) => [item.id, item]));
            incoming.forEach((item: RequestItem) => map.set(item.id, item));
            return Array.from(map.values());
          });
        }
      }
    } finally {
      requestInFlight.current = false;
      setLoadingRequests(false);
    }
  }, [user, event, lastSync, withAuth]);

  useEffect(() => {
    if (user && user.role === "DJ" && !event) {
      loadEvents();
    }
  }, [user, event, loadEvents]);

  useEffect(() => {
    if (!user || user.role !== "DJ" || !event) return;
    loadRequests();
    const interval = setInterval(loadRequests, REQUEST_POLL_MS);
    return () => clearInterval(interval);
  }, [user, event, loadRequests]);

  const loadSpotifyStatus = useCallback(async () => {
    if (!user || user.role !== "DJ") return;
    try {
      const { res, data } = await apiFetch(`${API_URL}/api/dj/spotify/status`, {
        headers: withAuth(),
      });
      if (!res.ok) return;
      setSpotifyConnected(Boolean(data?.connected));
    } catch {
      setSpotifyError("No se pudo consultar Spotify");
    }
  }, [user, withAuth]);

  useEffect(() => {
    if (user && user.role === "DJ") {
      loadSpotifyStatus();
    }
  }, [user, loadSpotifyStatus]);

  const createRequest = async ({
    songTitle,
    artist,
    message,
    tipAmount,
  }: {
    songTitle: string;
    artist?: string | null;
    message?: string | null;
    tipAmount: number;
  }) => {
    if (!joinCode.trim()) {
      setRequestError("Ingresa un codigo de evento");
      return;
    }
    setRequestError("");
    setRequestNotice("");
    setPendingPayment(null);
    try {
      const { res, data } = await apiFetch(
        `${API_URL}/api/public/events/${joinCode.trim().toUpperCase()}/requests`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-device-id": deviceRef.current,
          },
          body: JSON.stringify({
            songTitle,
            artist,
            message,
            nickname,
            deviceHash: deviceRef.current,
            tipAmount,
          }),
        }
      );
      if (!res.ok) {
        setRequestError(data?.error || "No se pudo enviar la solicitud");
        return;
      }
      if (data?.clientSecret) {
        setPendingPayment({
          clientSecret: data.clientSecret,
          requestId: data.request?.id,
          amountCents: data.amountCents,
        });
        setRequestNotice("Completa el pago para enviar la propina.");
        return;
      }
      setRequestNotice("Solicitud enviada");
    } catch {
      setRequestError("Error de conexión con el servidor");
    }
  };

  const updateRequestStatus = async (id: number, status: string) => {
    if (!event) return;
    try {
      await apiFetch(`${API_URL}/api/dj/requests/${id}`, {
        method: "PATCH",
        headers: withAuth({ "Content-Type": "application/json" }),
        body: JSON.stringify({ status }),
      });
      loadRequests();
    } catch {
      setDjError("Error de conexión con el servidor");
    }
  };

  const playSong = async (id: number) => updateRequestStatus(id, "playing");
  const markAsPlayed = async (id: number) => updateRequestStatus(id, "done");

  const acceptRequest = async (id: number) => {
    try {
      await apiFetch(`${API_URL}/api/dj/requests/${id}/accept`, {
        method: "POST",
        headers: withAuth(),
      });
      loadRequests();
    } catch {
      setDjError("Error de conexión con el servidor");
    }
  };

  const rejectRequest = async (id: number) => {
    try {
      await apiFetch(`${API_URL}/api/dj/requests/${id}/reject`, {
        method: "POST",
        headers: withAuth(),
      });
      loadRequests();
    } catch {
      setDjError("Error de conexión con el servidor");
    }
  };

  const banDevice = async (deviceHash?: string | null) => {
    if (!event || !deviceHash) return;
    try {
      await apiFetch(`${API_URL}/api/dj/events/${event.id}/ban-device`, {
        method: "POST",
        headers: withAuth({ "Content-Type": "application/json" }),
        body: JSON.stringify({ deviceHash }),
      });
      loadRequests();
    } catch {
      setDjError("Error de conexión con el servidor");
    }
  };

  const confirmPayment = async (requestId: number, paymentIntentId: string) => {
    await apiFetch(`${API_URL}/api/public/requests/${requestId}/confirm-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentIntentId }),
    });
    setPendingPayment(null);
    setRequestNotice("Pago autorizado. El DJ decidirá la prioridad.");
  };

  const loadPublicPlaylist = async (code: string) => {
    if (!code.trim()) return;
    setPlaylistLoading(true);
    setPlaylistError("");
    try {
      const { res, data } = await apiFetch(
        `${API_URL}/api/public/events/${code.trim().toUpperCase()}/playlist`
      );
      if (!res.ok) {
        setPlaylistError(data?.error || "No se pudo cargar la playlist");
        setPlaylistTracks([]);
        setPlaylistName("");
        return;
      }
      setPlaylistTracks(data?.tracks || []);
      setPlaylistName(data?.playlistName || "");
    } catch {
      setPlaylistError("Error de conexión con el servidor");
    } finally {
      setPlaylistLoading(false);
    }
  };

  const voteTrack = async (trackId: string) => {
    if (!joinCode.trim()) {
      setVoteError("Ingresa un codigo de evento");
      return;
    }
    setVoteError("");
    setVoteNotice("");
    try {
      const { res, data } = await apiFetch(
        `${API_URL}/api/public/events/${joinCode.trim().toUpperCase()}/votes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-device-id": deviceRef.current,
          },
          body: JSON.stringify({ trackId, deviceHash: deviceRef.current }),
        }
      );
      if (!res.ok) {
        const retry = data?.retryAfterSeconds;
        if (data?.code === "COOLDOWN" && Number.isFinite(retry)) {
          const until = Date.now() + retry * 1000;
          setVoteCooldownUntil(until);
          localStorage.setItem(
            `${STORAGE_VOTE_COOLDOWN}-${joinCode}`,
            String(until)
          );
          setVoteError(`Espera ${retry} segundos para volver a votar`);
        } else {
          setVoteError(data?.error || "No se pudo votar");
        }
        return;
      }
      const until = Date.now() + 20 * 60 * 1000;
      setVoteCooldownUntil(until);
      localStorage.setItem(
        `${STORAGE_VOTE_COOLDOWN}-${joinCode}`,
        String(until)
      );
      setVoteNotice("Voto enviado");
      loadPublicPlaylist(joinCode);
    } catch {
      setVoteError("Error de conexión con el servidor");
    }
  };

  const connectSpotify = async () => {
    setSpotifyError("");
    try {
      const { res, data } = await apiFetch(`${API_URL}/api/dj/spotify/connect`, {
        headers: withAuth(),
      });
      if (!res.ok) {
        setSpotifyError(data?.error || "No se pudo conectar Spotify");
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch {
      setSpotifyError("Error de conexión con Spotify");
    }
  };

  const disconnectSpotify = async () => {
    setSpotifyError("");
    try {
      const { res, data } = await apiFetch(
        `${API_URL}/api/dj/spotify/disconnect`,
        {
          method: "POST",
          headers: withAuth(),
        }
      );
      if (!res.ok) {
        setSpotifyError(data?.error || "No se pudo desconectar Spotify");
        return;
      }
      setSpotifyConnected(false);
      setSpotifyPlaylists([]);
    } catch {
      setSpotifyError("Error de conexión con Spotify");
    }
  };

  const loadSpotifyPlaylists = async () => {
    if (!spotifyConnected) return;
    setSpotifyLoading(true);
    setSpotifyError("");
    try {
      const { res, data } = await apiFetch(`${API_URL}/api/dj/spotify/playlists`, {
        headers: withAuth(),
      });
      if (!res.ok) {
        setSpotifyError(data?.error || "No se pudieron cargar las listas");
        return;
      }
      setSpotifyPlaylists(data?.playlists || []);
    } catch {
      setSpotifyError("Error de conexión con Spotify");
    } finally {
      setSpotifyLoading(false);
    }
  };

  const sortedRequests = [...requests].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return (a.createdAt || "").localeCompare(b.createdAt || "");
  });

  const value: DjContextValue = {
    user,
    event,
    eventName,
    setEventName,
    eventError,
    joinCode,
    nickname,
    requestNotice,
    requestError,
    djNotice,
    djError,
    sortedRequests,
    loadingRequests,
    pendingPayment,
    spotifyConnected,
    spotifyPlaylists,
    spotifyLoading,
    spotifyError,
    playlistTracks,
    playlistName,
    playlistLoading,
    playlistError,
    voteNotice,
    voteError,
    voteCooldownUntil,
    setJoinCode,
    setNickname,
    login,
    register,
    logout,
    createEvent,
    createRequest,
    playSong,
    markAsPlayed,
    acceptRequest,
    rejectRequest,
    banDevice,
    confirmPayment,
    connectSpotify,
    loadSpotifyPlaylists,
    setEventPlaylist,
    loadPublicPlaylist,
    voteTrack,
    disconnectSpotify,
  };

  return <DjContext.Provider value={value}>{children}</DjContext.Provider>;
}

export function useDjContext() {
  const ctx = useContext(DjContext);
  if (!ctx) {
    throw new Error("useDjContext must be used within DjProvider");
  }
  return ctx;
}
