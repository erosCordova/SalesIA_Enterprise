import React from "react";
import ReactDOM from "react-dom/client";

import RootApp from "./App";

import "./modules/auth/login.css";
import "./styles/global.css";
import "./styles/layout.css";
import "./styles/enterprise-v2.css";
import "./styles/salesia-cyan-theme.css";

ReactDOM.createRoot(
  document.getElementById("root")!,
).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>,
);
