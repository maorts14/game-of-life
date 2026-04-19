import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { AboutScreen } from "./screens/AboutScreen";
import { GameScreen } from "./screens/GameScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { WorldsScreen } from "./screens/WorldsScreen";

function LegacyGameRouteRedirect() {
  const { worldId } = useParams();

  if (!worldId) {
    return <Navigate to="/worlds" replace />;
  }

  return <Navigate to={`/game/local/${worldId}`} replace />;
}

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/worlds" element={<WorldsScreen />} />
        <Route path="/about" element={<AboutScreen />} />
        <Route path="/game/:storageMode/:worldId" element={<GameScreen />} />
        <Route path="/game/:worldId" element={<LegacyGameRouteRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
