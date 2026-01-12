import React, { useEffect, useState } from "react";
import { DollarSign, Music, BarChart3 } from "lucide-react";
import DJLayout from "../components/dj/DJLayout";
import DJPanel from "../components/DJPanel";
import Login from "../components/Login";
import Register from "../components/Register";
import { useDjContext } from "../context/DjContext";

export default function DjDashboard() {
  const [showRegister, setShowRegister] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const {
    user,
    event,
    eventName,
    setEventName,
    eventError,
    sortedRequests,
    spotifyConnected,
    spotifyPlaylists,
    spotifyLoading,
    spotifyError,
    requestError,
    djNotice,
    djError,
    logout,
    createEvent,
    playSong,
    markAsPlayed,
    acceptRequest,
    rejectRequest,
    banDevice,
    approveRequest,
    connectSpotify,
    loadSpotifyPlaylists,
    setEventPlaylist,
    loadPublicPlaylist,
    playlistTracks,
    disconnectSpotify,
  } = useDjContext();

  const totalTips = sortedRequests.reduce(
    (sum, item) => sum + (item.tipAmount || 0),
    0
  );
  const pendingRequests = sortedRequests.filter(
    (item) => item.status === "pending"
  );
  const queueRequests = sortedRequests.filter(
    (item) => item.status === "queued" || item.status === "playing"
  );

  useEffect(() => {
    if (activeSection === "playlists" && spotifyConnected) {
      loadSpotifyPlaylists();
    }
  }, [activeSection, spotifyConnected, loadSpotifyPlaylists]);

  useEffect(() => {
    if (activeSection === "stats" && event?.joinCode) {
      loadPublicPlaylist(event.joinCode);
    }
  }, [activeSection, event?.joinCode, loadPublicPlaylist]);

  useEffect(() => {
    if (activeSection === "home" && event?.joinCode) {
      loadPublicPlaylist(event.joinCode);
    }
  }, [activeSection, event?.joinCode, loadPublicPlaylist]);

  if (!user) {
    return (
      <div className="page-shell flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900">Panel DJ</h1>
            <p className="text-sm text-gray-500">
              Gestiona tu evento y monetiza las peticiones.
            </p>
          </div>
          {showRegister ? <Register /> : <Login />}
          <div className="text-center text-sm text-gray-500">
            <button
              className="text-indigo-600 hover:text-indigo-800"
              onClick={() => setShowRegister(!showRegister)}
            >
              {showRegister ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DJLayout
      title={event?.name}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      onLogout={logout}
    >
      {activeSection === "home" && (
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Panel de control</h1>
            <p className="text-sm text-gray-500">
              Gestiona la cola de reproducción y los ingresos en tiempo real.
            </p>
          </div>

          {!event ? (
            <div className="card p-6 max-w-lg">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-full bg-indigo-50 p-3">
                  <Music className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Crea tu primer evento
                  </h3>
                  <p className="text-sm text-gray-500">
                    Genera un código único para tus invitados.
                  </p>
                </div>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!eventName.trim()) return;
                  createEvent(eventName.trim());
                }}
                className="space-y-3"
              >
                <input
                  className="input"
                  placeholder="Nombre del evento"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                />
                {eventError && (
                  <p className="text-sm text-red-600">{eventError}</p>
                )}
                <button className="btn-primary w-full">Crear evento</button>
              </form>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Evento activo
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Código público:
                </p>
                <p className="mt-2 text-2xl font-mono font-bold text-indigo-600">
                  {event.joinCode}
                </p>
              </div>
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Canciones más votadas
                </h3>
                {!event.spotifyPlaylistName ? (
                  <p className="text-sm text-gray-500 mt-2">
                    Selecciona una playlist en “Mis listas” para ver el top.
                  </p>
                ) : playlistTracks.length === 0 ? (
                  <p className="text-sm text-gray-500 mt-2">
                    Aún no hay votos para esta playlist.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-2 text-sm text-gray-700">
                    {playlistTracks.slice(0, 5).map((track, index) => (
                      <li
                        key={track.trackId}
                        className="flex items-center justify-between"
                      >
                        <span>
                          {index + 1}. {track.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {track.votes} votos
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="card p-5 border-l-4 border-l-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">
                    Ingresos
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-gray-900">
                    €{totalTips}
                  </h3>
                </div>
                <div className="rounded-full bg-green-50 p-3">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>
            <div className="card p-5 border-l-4 border-l-indigo-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">
                    En cola
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-gray-900">
                    {sortedRequests.length}
                  </h3>
                </div>
                <div className="rounded-full bg-indigo-50 p-3">
                  <Music className="h-5 w-5 text-indigo-600" />
                </div>
              </div>
            </div>
            <div className="card p-5 border-l-4 border-l-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">
                    Actividad
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-gray-900">
                    En vivo
                  </h3>
                </div>
                <div className="rounded-full bg-yellow-50 p-3">
                  <BarChart3 className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="font-semibold text-gray-800">
                Cola de reproducción
              </h3>
              <span className="text-xs rounded-full bg-green-100 px-2 py-1 font-semibold text-green-700 animate-pulse">
                En vivo
              </span>
            </div>
            <div className="p-6">
              <DJPanel
                requests={queueRequests}
                mode="queue"
                onPlay={playSong}
                onMarkAsPlayed={markAsPlayed}
                onBanDevice={banDevice}
              />
            </div>
          </div>

        </div>
      )}

      {activeSection === "event" && (
        <div className="space-y-6">
          {!event ? (
            <div className="card p-6 max-w-lg">
              <h3 className="text-lg font-semibold text-gray-900">
                Crear evento
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Crea un código para compartir con tus invitados.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!eventName.trim()) return;
                  createEvent(eventName.trim());
                }}
                className="mt-4 space-y-3"
              >
                <input
                  className="input"
                  placeholder="Nombre del evento"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                />
                {eventError && (
                  <p className="text-sm text-red-600">{eventError}</p>
                )}
                <button className="btn-primary w-full">Crear evento</button>
              </form>
            </div>
          ) : (
            <div className="card p-6 max-w-lg">
              <h3 className="text-lg font-semibold text-gray-900">
                Evento activo
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                Código de acceso:
              </p>
              <p className="mt-2 text-3xl font-mono font-bold text-indigo-600">
                {event.joinCode}
              </p>
              {requestError && (
                <p className="mt-3 text-sm text-red-600">{requestError}</p>
              )}
              {djNotice && (
                <p className="mt-3 text-sm text-green-600">{djNotice}</p>
              )}
              {djError && (
                <p className="mt-3 text-sm text-red-600">{djError}</p>
              )}
            </div>
          )}
        </div>
      )}

      {activeSection === "requests" && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="font-semibold text-gray-800">
                Solicitudes pendientes
              </h3>
              <span className="text-xs rounded-full bg-green-100 px-2 py-1 font-semibold text-green-700 animate-pulse">
                En vivo
              </span>
            </div>
            <div className="p-6">
              <DJPanel
                requests={pendingRequests}
                mode="pending"
                onApprove={approveRequest}
                onReject={rejectRequest}
                onPlay={playSong}
                onMarkAsPlayed={markAsPlayed}
                onBanDevice={banDevice}
              />
            </div>
          </div>
        </div>
      )}

      {activeSection === "playlists" && (
        <div className="space-y-4 max-w-2xl">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Conectar Spotify
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Conecta tu cuenta para cargar tus playlists disponibles.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className="btn-primary"
                onClick={connectSpotify}
                disabled={spotifyConnected}
              >
                {spotifyConnected ? "Conectado" : "Conectar con Spotify"}
              </button>
              {spotifyConnected && (
                <button
                  className="btn-secondary"
                  onClick={disconnectSpotify}
                >
                  Desconectar
                </button>
              )}
            </div>
            {spotifyError && (
              <p className="mt-3 text-sm text-red-600">{spotifyError}</p>
            )}
          </div>

          {spotifyConnected && (
            <div className="card p-6">
              <h4 className="text-base font-semibold text-gray-900">
                Listas disponibles
              </h4>
              {event?.spotifyPlaylistName && (
                <p className="mt-1 text-sm text-gray-600">
                  Lista activa:{" "}
                  <span className="font-semibold text-gray-900">
                    {event.spotifyPlaylistName}
                  </span>
                </p>
              )}
              {spotifyLoading ? (
                <p className="text-sm text-gray-500 mt-2">Cargando listas...</p>
              ) : spotifyPlaylists.length === 0 ? (
                <p className="text-sm text-gray-500 mt-2">
                  Sin listas para mostrar.
                </p>
              ) : (
                <ul className="mt-4 space-y-3 text-sm text-gray-700">
                  {spotifyPlaylists.map((playlist) => (
                    <li
                      key={playlist.id}
                      className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {playlist.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {playlist.tracksTotal} tracks
                        </p>
                      </div>
                      <button
                        className="btn-secondary"
                        onClick={() => setEventPlaylist(playlist.id)}
                        disabled={!event}
                      >
                        Usar en evento
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {activeSection === "stats" && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
          <div className="card p-5 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Ingresos
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-gray-900">
                  €{totalTips}
                </h3>
              </div>
              <div className="rounded-full bg-green-50 p-3">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="card p-5 border-l-4 border-l-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  En cola
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-gray-900">
                  {sortedRequests.length}
                </h3>
              </div>
              <div className="rounded-full bg-indigo-50 p-3">
                <Music className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
          </div>
          <div className="card p-5 border-l-4 border-l-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Actividad
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-gray-900">
                  En vivo
                </h3>
              </div>
              <div className="rounded-full bg-yellow-50 p-3">
                <BarChart3 className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Top por votos
            </h3>
            {!event?.spotifyPlaylistName ? (
              <p className="text-sm text-gray-500 mt-2">
                Selecciona una playlist en “Mis listas” para ver el top.
              </p>
            ) : playlistTracks.length === 0 ? (
              <p className="text-sm text-gray-500 mt-2">
                Aún no hay votos para esta playlist.
              </p>
            ) : (
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                {playlistTracks.slice(0, 5).map((track, index) => (
                  <li
                    key={track.trackId}
                    className="flex items-center justify-between"
                  >
                    <span>
                      {index + 1}. {track.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {track.votes} votos
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {activeSection === "payments" && (
        <div className="card p-6 max-w-xl">
          <h3 className="text-lg font-semibold text-gray-900">Pagos</h3>
          <p className="text-sm text-gray-500 mt-2">
            Aquí podrás ver el detalle de propinas y pagos cuando esté conectado.
          </p>
        </div>
      )}

      {activeSection === "settings" && (
        <div className="card p-6 max-w-xl">
          <h3 className="text-lg font-semibold text-gray-900">Configuración</h3>
          <p className="text-sm text-gray-500 mt-2">
            Próximamente: límites, cooldowns y ajustes del evento.
          </p>
          <div className="mt-4 space-y-3">
            <button className="btn-secondary w-full justify-start">
              Pausar solicitudes
            </button>
            <button className="btn-secondary w-full justify-start">
              Modo solo propinas
            </button>
            <button className="btn-secondary w-full justify-start text-red-600">
              Finalizar evento
            </button>
          </div>
        </div>
      )}
    </DJLayout>
  );
}
