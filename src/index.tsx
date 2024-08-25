import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { AuthProvider } from "react-oidc-context";

// CHANGE authServerUrl to your Auth Server URL
const authServerUrl = "http://localhost:9090/";
const realm = "videoclub";
const client = "web";

const oidcConfig = {
  authority: `${authServerUrl}realms/${realm}`,
  client_id: client,
  // CHANGE redirect_uri to your app url
  redirect_uri: "http://localhost:3000",
  onSigninCallback: (args: any) =>
    window.history.replaceState({}, document.title, window.location.pathname),
};

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <AuthProvider {...oidcConfig}>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
