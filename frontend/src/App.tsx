import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { RequireAuth } from "./components/RequireAuth";
import { AboutScreen } from "./screens/AboutScreen";
import { AuthScreen } from "./screens/AuthScreen";
import { GameScreen } from "./screens/GameScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { WorldsScreen } from "./screens/WorldsScreen";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/worlds" element={<WorldsScreen />} />
        <Route path="/login" element={<AuthScreen mode="login" />} />
        <Route path="/signup" element={<AuthScreen mode="signup" />} />
        <Route path="/about" element={<AboutScreen />} />
        <Route path="/game/local/:worldId" element={<GameScreen source="local" />} />
        <Route
          path="/game/cloud/:worldId"
          element={
            <RequireAuth>
              <GameScreen source="cloud" />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
