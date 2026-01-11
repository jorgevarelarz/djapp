import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { Menu, Music, X } from "lucide-react";

export default function Layout({ children }) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path
      ? "text-white bg-white/10"
      : "text-white/60 hover:text-white hover:bg-white/5";

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Toaster richColors theme="dark" position="top-center" />

      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight"
          >
            <img
              src="/beatbit-logo.png"
              alt="BeatBid logo"
              className="h-4 w-4 rounded border border-white/20 object-contain"
            />
            <span className="text-base font-semibold">BeatBid</span>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            <Link
              to="/"
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${isActive(
                "/"
              )}`}
            >
              Inicio
            </Link>
            <Link
              to="/dj"
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${isActive(
                "/dj"
              )}`}
            >
              Soy DJ
            </Link>
            <div className="mx-2 h-4 w-px bg-border" />
            <Link
              to="/dj"
              className="btn-primary h-9 px-4 py-2"
            >
              Iniciar Sesión
            </Link>
          </nav>

          <button
            className="p-2 text-white/60 hover:text-white md:hidden"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label="Abrir menu"
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="border-t border-border bg-background p-4 md:hidden">
            <Link
              to="/"
              className="block rounded-md px-4 py-3 hover:bg-white/10"
              onClick={() => setIsMenuOpen(false)}
            >
              Inicio
            </Link>
            <Link
              to="/dj"
              className="mt-2 block rounded-md px-4 py-3 hover:bg-white/10"
              onClick={() => setIsMenuOpen(false)}
            >
              Zona DJ
            </Link>
          </div>
        )}
      </header>

      <main className="flex-1 w-full">{children}</main>

      <footer className="border-t border-border bg-background py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-white/60 md:flex-row">
          <p>© 2024 BeatBid Inc.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white">
              Privacidad
            </a>
            <a href="#" className="hover:text-white">
              Términos
            </a>
            <a href="#" className="hover:text-white">
              Contacto
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
