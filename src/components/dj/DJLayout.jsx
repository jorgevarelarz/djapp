import React, { useState } from "react";
import DJSidebar from "./DJSidebar";
import DJTopbar from "./DJTopbar";

export default function DJLayout({
  title,
  activeSection,
  onSectionChange,
  onLogout,
  children,
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DJTopbar
        title={title}
        onMenuClick={() => setIsOpen(true)}
        onLogout={onLogout}
      />

      <div className="mx-auto flex w-full max-w-6xl gap-6 px-6 py-8">
        <DJSidebar
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          onLogout={onLogout}
        />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
