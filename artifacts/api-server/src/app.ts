import express, { type Express } from "express";
import cors, { type CorsOptions } from "cors";
import router from "./routes";

const app: Express = express();

const isProduction = process.env.NODE_ENV === "production";
const allowPermissiveLocalCors = !isProduction && process.env.CORS_PERMISSIVE_LOCAL === "true";
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests that do not include an Origin header (for server-to-server/health checks).
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowPermissiveLocalCors) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    console.warn(
      `[CORS] Blocked origin "${origin}". NODE_ENV=${process.env.NODE_ENV ?? "undefined"} ` +
        `ALLOWED_ORIGINS_COUNT=${allowedOrigins.length}`,
    );

    if (isProduction) {
      callback(new Error("Origin not allowed by CORS"));
      return;
    }

    callback(null, false);
  },
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: isProduction || process.env.CORS_ALLOW_CREDENTIALS === "true",
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
