import React from "react";
import { Route, Routes } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import Landing from "./pages/Landing";
import GuestEvent from "./pages/GuestEvent";
import DjDashboard from "./pages/DjDashboard";

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/event/:joinCode" element={<GuestEvent />} />
        <Route path="/dj" element={<DjDashboard />} />
      </Routes>
    </AppProvider>
  );
}
