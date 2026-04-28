import express, { type Express } from "express";
import cors from "cors";
import router from "./routes";
import { createRouteLimiter } from "./middleware/security.js";

const app: Express = express();

app.set("trust proxy", 1);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(createRouteLimiter({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: "Too many requests from this IP. Please try again later.",
}));

app.use("/api", router);

export default app;
