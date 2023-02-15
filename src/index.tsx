import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import Home from "./pages/Home";
import { MantineProvider } from "@mantine/core";
import { NotificationsProvider } from "@mantine/notifications";
import {
  BrowserRouter,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import Game from "./pages/Game";
import Incompatible from "./pages/Incompatible";

const root = ReactDOM.createRoot(document.getElementById("root")!);

function HomeRoute() {
  const navigate = useNavigate();
  return <Home navigate={navigate} />;
}

function GameRoute() {
  const { game } = useParams();
  const navigate = useNavigate();
  if (game) return <Game game={game} navigate={navigate} />;
  return null;
}

root.render(
  <MantineProvider
    withCSSVariables
    withGlobalStyles
    withNormalizeCSS
    theme={{
      colorScheme: "dark",
      fontFamily: "Inter",
    }}
  >
    <NotificationsProvider>
      {window.innerHeight >= 600 && window.innerWidth >= 800 ? (
        <BrowserRouter>
          <Routes>
            <Route index path="/" element={<HomeRoute />} />
            <Route path=":game" element={<GameRoute />} />
          </Routes>
        </BrowserRouter>
      ) : (
        <Incompatible />
      )}
    </NotificationsProvider>
  </MantineProvider>
);
