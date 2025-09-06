import express from "express";
import { logEvent } from "../LoggingMiddleware/logger.js";
import urlRoutes from "./routes/userRoutes.js";

const app = express();
app.use(express.json());

// mount routes
app.use("/", urlRoutes);

// simple health check
app.get("/health", async (req, res) => {
  await logEvent("backend", "info", "health", "Health check OK", process.env.ACCESS_TOKEN);
  res.send({ status: "UP" });
});

export default app;
