import React from "react";
import {
  CalendarDays,
  ListMusic,
  BarChart3,
  DollarSign,
  Settings,
  LogOut,
  LayoutDashboard,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "home", label: "Inicio", icon: LayoutDashboard },
  { id: "event", label: "Evento", icon: CalendarDays },
  { id: "requests", label: "Solicitudes", icon: ListMusic },
  { id: "stats", label: "Estadísticas", icon: BarChart3 },
  { id: "payments", label: "Pagos", icon: DollarSign },
  { id: "settings", label: "Ajustes", icon: Settings },
];

export default function DJSidebar({
  isOpen,
  onClose,
  activeSection,
  onSectionChange,
  onLogout,
}) {
  const handleNavigate = (id) => {
    onSectionChange(id);
    onClose();
  };

  return (
    <>
      <aside className="hidden w-64 shrink-0 md:block">
        <div className="sticky top-20 rounded-2xl bg-card/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Cabina
          </p>
          <nav className="mt-6 space-y-1">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleNavigate(id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  activeSection === id
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 text-white/60" />
                {label}
              </button>
            ))}
          </nav>

          <div className="mt-6 border-t border-border pt-4">
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white"
            >
              <LogOut className="h-4 w-4 text-white/60" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-background p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Panel DJ</p>
              <button
                onClick={onClose}
                className="text-sm text-white/60"
              >
                Cerrar
              </button>
            </div>
            <nav className="mt-6 space-y-2">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleNavigate(id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                    activeSection === id
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 text-white/60" />
                  {label}
                </button>
              ))}
            </nav>
            <div className="mt-6 border-t border-border pt-4">
              <button
                onClick={onLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white"
              >
                <LogOut className="h-4 w-4 text-white/60" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
