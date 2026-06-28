import express from "express";
import cookieParser from "cookie-parser"
import cors from "cors"

const app = express();

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

app.use(cookieParser());

//cors configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

import healthCheckRouter from "./routes/healthcheck.route.js";
import userRouter from "./routes/auth.route.js";
import healthRecordRouter from "./routes/healthRecord.route.js"
import { errorHandler } from "./middlewares/error.middleware.js";

app.use("/api/users", userRouter);
app.use("/api/healthcheck" , healthCheckRouter)
app.use("/api/healthrecord", healthRecordRouter)

app.use(errorHandler);
export { app };