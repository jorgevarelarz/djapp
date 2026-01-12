import React from "react";
import { Menu } from "lucide-react";

type Props = {
  title?: string;
  onMenuClick: () => void;
};

export default function DJTopbar({ title, onMenuClick }: Props) {
  return (
    <header className="navbar">
      <div className="container">
        <div className="navbar-inner">
          <button className="btn-icon md:hidden" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
              Panel DJ
            </p>
            <h1 className="text-sm font-semibold text-gray-900">
              {title || "Sin evento activo"}
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
}
