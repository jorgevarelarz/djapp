import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAppContext } from "../context/AppContext";

export default function Landing() {
  const navigate = useNavigate();
  const { joinCode, setJoinCode, requestError, setRequestError } =
    useAppContext();

  const normalized = useMemo(
    () => joinCode.trim().toUpperCase().replace(/\s+/g, ""),
    [joinCode]
  );
  const canEnter = normalized.length >= 4;

  function onSubmit(e) {
    e.preventDefault();
    if (!canEnter) return;
    setRequestError("");
    navigate(`/event/${normalized}`);
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto max-w-5xl px-4 pb-14 pt-6">
        <section className="mx-auto max-w-2xl text-center">
          <p className="text-xs tracking-[0.35em] text-white/50">
            THE PARTY REMOTE
          </p>

          <h1 className="mt-4 text-4xl font-extrabold leading-tight">
            Pide canciones sin gritar.
            <span className="block text-white/90">
              Haz que la pista responda.
            </span>
          </h1>

          <p className="mt-4 text-base text-white/70">
            Conecta al público con el DJ en segundos. Peticiones, votos y tips
            opcionales.
          </p>

          <form onSubmit={onSubmit} className="mt-8">
            <label className="sr-only">Código de evento</label>

            <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Código del evento"
                className="w-full bg-transparent px-3 py-3 text-center text-lg font-semibold tracking-widest outline-none placeholder:text-white/30"
                autoCapitalize="characters"
              />
              <button
                type="submit"
                disabled={!canEnter}
                className="mt-3 w-full rounded-xl bg-white py-3 text-base font-semibold text-black disabled:opacity-40"
              >
                Entrar
              </button>
            </div>

            {requestError && (
              <p className="mt-3 text-xs text-red-300">{requestError}</p>
            )}

            <p className="mt-3 text-xs text-white/55">
              Sin apps · Sin registro · Tips opcionales
            </p>
          </form>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => navigate("/dj")}
              className="rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold ring-1 ring-white/15 hover:bg-white/15"
            >
              Soy DJ: crear evento
            </button>
          </div>
        </section>

        <section className="mx-auto mt-14 max-w-5xl">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
              <h2 className="text-2xl font-bold">Para DJs: control sin caos.</h2>
              <p className="mt-2 text-white/70">
                Una cabina ordenada: moderación, prioridades y cola clara.
              </p>

              <ul className="mt-5 space-y-3 text-sm text-white/75">
                <li>• Cola inteligente: lo que más apoyo tiene sube.</li>
                <li>• Moderación: rechaza y bloquea dispositivos molestos.</li>
                <li>• Tips opcionales: prioridad sin romper la experiencia.</li>
              </ul>

              <button
                onClick={() => navigate("/dj")}
                className="mt-6 w-full rounded-xl bg-white/10 py-3 font-semibold ring-1 ring-white/15 hover:bg-white/15"
              >
                Crear mi primer evento
              </button>
            </div>

            <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
              <p className="text-sm font-semibold text-white/80">Vista cabina</p>
              <div className="mt-4 h-72 rounded-xl bg-black/40 ring-1 ring-white/10" />
              <p className="mt-3 text-xs text-white/55">
                Consejo: prueba en un evento real con 2 móviles y un portátil.
              </p>
            </div>
          </div>
        </section>

        <footer className="mx-auto mt-14 max-w-5xl border-t border-white/10 pt-8 text-center text-xs text-white/45">
          © {new Date().getFullYear()} BeatBid · Privacidad · Términos · Contacto
        </footer>
      </main>
    </div>
  );
}
