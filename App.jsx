import React, { useState } from "react";
import SongRequestForm from "./components/SongRequestForm";
import DJPanel from "./components/DJPanel";

function App() {
  const [role, setRole] = useState(null);
  const [requests, setRequests] = useState([]);

  const handleAddRequest = (newRequest) => {
    setRequests((prev) => [...prev, newRequest]);
  };

  const sortedRequests = [...requests].sort((a, b) => {
    const aScore = a.tip * 100 + a.votes;
    const bScore = b.tip * 100 + b.votes;
    return bScore - aScore;
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-6">
      {!role && (
        <div className="flex flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-semibold">Who are you?</h1>
          <button onClick={() => setRole("user")} className="bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition">
            I am a guest
          </button>
          <button onClick={() => setRole("dj")} className="border border-black px-4 py-2 rounded-xl hover:bg-gray-100 transition">
            I am the DJ
          </button>
        </div>
      )}

      {role === "user" && <SongRequestForm onAddRequest={handleAddRequest} />}
      {role === "dj" && <DJPanel requests={sortedRequests} />}
    </div>
  );
}

export default App;

