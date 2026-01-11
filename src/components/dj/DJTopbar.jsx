import React from "react";
import { Menu } from "lucide-react";

export default function DJTopbar({ title, onMenuClick, onLogout }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="rounded-md p-2 text-white/70 hover:bg-white/5 hover:text-white md:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">
              Panel DJ
            </p>
            <h1 className="text-sm font-semibold text-white">
              {title || "Sin evento activo"}
            </h1>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="hidden rounded-md bg-white/10 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/15 md:inline-flex"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
