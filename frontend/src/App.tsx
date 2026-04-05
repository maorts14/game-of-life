import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { AboutScreen } from "./screens/AboutScreen";
import { GameScreen } from "./screens/GameScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { WorldsScreen } from "./screens/WorldsScreen";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/worlds" element={<WorldsScreen />} />
        <Route path="/about" element={<AboutScreen />} />
        <Route path="/game/:worldId" element={<GameScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
