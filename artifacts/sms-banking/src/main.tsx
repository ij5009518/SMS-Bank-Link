import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { installAuthFetch } from "./lib/auth-fetch";

// Install the auth fetch interceptor before any request is made.
installAuthFetch();

createRoot(document.getElementById("root")!).render(<App />);
