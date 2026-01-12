import React, { useState } from "react";
import DJSidebar from "./DJSidebar";
import DJTopbar from "./DJTopbar";

type Props = {
  title?: string;
  activeSection: string;
  onSectionChange: (id: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
};

export default function DJLayout({
  title,
  activeSection,
  onSectionChange,
  onLogout,
  children,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="page-shell">
      <DJTopbar title={title} onMenuClick={() => setOpen(true)} />
      <div className="container flex gap-6 py-8">
        <DJSidebar
          isOpen={open}
          onClose={() => setOpen(false)}
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          onLogout={onLogout}
        />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
