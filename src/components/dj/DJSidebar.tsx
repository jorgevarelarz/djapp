import React from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Music2,
  ListMusic,
  BarChart3,
  Settings,
  LogOut,
  DollarSign,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "home", label: "Vista general", icon: LayoutDashboard },
  { id: "event", label: "Evento", icon: CalendarDays },
  { id: "playlists", label: "Mis listas", icon: Music2 },
  { id: "requests", label: "Solicitudes", icon: ListMusic },
  { id: "stats", label: "Estadísticas", icon: BarChart3 },
  { id: "payments", label: "Ingresos", icon: DollarSign },
  { id: "settings", label: "Configuración", icon: Settings },
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
  onSectionChange: (id: string) => void;
  onLogout: () => void;
};

export default function DJSidebar({
  isOpen,
  onClose,
  activeSection,
  onSectionChange,
  onLogout,
}: Props) {
  const renderNav = () => (
    <nav className="space-y-1">
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = activeSection === id;
        return (
          <button
            key={id}
            onClick={() => {
              onSectionChange(id);
              onClose();
            }}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
              isActive
                ? "bg-indigo-50 text-indigo-700"
                : "text-gray-600 hover:bg-slate-100 hover:text-gray-900"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 md:block">
        <div className="sticky top-20 card p-4">
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-semibold text-white">
              B
            </div>
            <span className="text-sm font-semibold text-gray-900">
              BeatBid Console
            </span>
          </div>
          {renderNav()}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="drawer-backdrop" onClick={onClose} />
          <div className="drawer-panel left-0 w-72 bg-white shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">
                BeatBid Console
              </span>
              <button onClick={onClose} className="text-sm text-gray-500">
                Cerrar
              </button>
            </div>
            {renderNav()}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <button
                onClick={onLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
