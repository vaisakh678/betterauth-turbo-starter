import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { APIError } from "./lib/api-error";
import { auth } from "./lib/auth";
import appRoutes from "./routes";

export function createApp() {
	const app = new Hono();
	app.use(logger());
	app.use("*", cors({
		origin: ["http://localhost:5173"],
		credentials: true,
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	}));

	app.onError((err, c) => {
		if (err instanceof APIError) {
			return c.json({ data: null, error: err.message }, err.statusCode as any);
		}
		console.error(`[Error] ${c.req.method} ${c.req.path}:`, err.message);
		return c.json({ data: null, error: "Internal server error" }, 500);
	});

	app.on(["POST", "GET"], "/api/auth/*", (c) => {
		return auth.handler(c.req.raw);
	});

	app.route("/api/v1", appRoutes);

	return app;
}
