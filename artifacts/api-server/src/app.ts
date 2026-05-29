import express, { type Express } from "express";
import cors, { type CorsOptions } from "cors";
import router from "./routes";

const app: Express = express();

// CORS: restrict to an explicit allowlist when CORS_ORIGIN is set
// (comma-separated). The web app is served same-origin in production, so this
// only matters for cross-origin callers. Defaults to reflecting the request
// origin in development.
const allowList = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions: CorsOptions = allowList.length
  ? {
      origin(origin, callback) {
        if (!origin || allowList.includes(origin)) return callback(null, true);
        return callback(new Error("Not allowed by CORS"));
      },
    }
  : {};

app.use(cors(corsOptions));

// Baseline security headers (kept dependency-free).
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
