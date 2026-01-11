import React from "react";
import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { AppProvider } from "./context/AppContext";
import Landing from "./pages/Landing";
import GuestEvent from "./pages/GuestEvent";
import DjDashboard from "./pages/DjDashboard";

export default function App() {
  return (
    <AppProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/event/:joinCode" element={<GuestEvent />} />
          <Route path="/dj" element={<DjDashboard />} />
        </Routes>
      </Layout>
    </AppProvider>
  );
}
