import React from "react";
import Canvas from "./components/Canvas";
import { Palette } from "lucide-react";

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Palette className="w-8 h-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">drAing</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden h-[calc(100vh-12rem)]">
          <Canvas />
        </div>
      </main>
    </div>
  );
}

export default App;
