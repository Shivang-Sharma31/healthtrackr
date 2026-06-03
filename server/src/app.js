import express from "express";

const app = express();

app.use(express.json());

import healthCheckRouter from "./routes/healthcheck.route.js";
import userRouter from "./routes/auth.route.js";

app.use("/api/users", userRouter);
app.use("/api/healthcheck" , healthCheckRouter)

export { app };