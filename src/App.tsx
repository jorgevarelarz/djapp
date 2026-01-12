import React from "react";
import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import GuestEvent from "./pages/GuestEvent";
import DjDashboard from "./pages/DjDashboard";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/event/:joinCode" element={<GuestEvent />} />
      <Route path="/dj" element={<DjDashboard />} />
    </Routes>
  );
}
