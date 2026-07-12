import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { globalLimiter } from "./middleware/rateLimit";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import routes from "./routes";

const app = express();

app.use(helmet());
app.use(
	cors({
		origin: env.FRONTEND_ORIGIN,
		credentials: true,
	}),
);
app.use(globalLimiter);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

app.get("/health", (_req, res) => {
	res.json({ status: "ok" });
});

app.use("/api", routes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;