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

const root = ReactDOM.createRoot(document.getElementById("root")!);

function HomeRoute() {
  const navigate = useNavigate();
  return <Home navigate={navigate} />;
}

function GameRoute() {
  const { code } = useParams();
  const navigate = useNavigate();
  if (code) return <Game code={code} navigate={navigate} />;
  return null;
}

root.render(
  <React.StrictMode>
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
        <BrowserRouter>
          <Routes>
            <Route index path="/" element={<HomeRoute />} />
            <Route path=":code" element={<GameRoute />} />
          </Routes>
        </BrowserRouter>
      </NotificationsProvider>
    </MantineProvider>
  </React.StrictMode>
);
