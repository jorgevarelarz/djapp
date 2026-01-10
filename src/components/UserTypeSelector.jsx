import React from "react";

export default function UserTypeSelector({ onSelect }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <h1 className="text-3xl font-semibold mb-8">¿Quién eres?</h1>
      <div className="flex gap-6">
        <button
          onClick={() => onSelect("dj")}
          className="px-8 py-4 bg-black text-white rounded-md text-lg hover:bg-gray-800 transition"
        >
          DJ
        </button>
        <button
          onClick={() => onSelect("user")}
          className="px-8 py-4 bg-white text-black border border-black rounded-md text-lg hover:bg-gray-100 transition"
        >
          Usuario
        </button>
      </div>
    </div>
  );
}

