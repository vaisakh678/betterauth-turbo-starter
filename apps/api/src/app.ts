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

	app.get("/api/auth/mobile/google", async (c) => {
		const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3001";
		const callbackURL = `${baseUrl}/api/auth/mobile-callback`;
		const url = new URL(`${baseUrl}/api/auth/sign-in/social`);
		const request = new Request(url.toString(), {
			method: "POST",
			headers: new Headers({
				"Content-Type": "application/json",
				"cookie": c.req.header("cookie") || "",
				"origin": baseUrl,
			}),
			body: JSON.stringify({ provider: "google", callbackURL }),
		});
		const response = await auth.handler(request);

		// Better Auth returns JSON with { url, redirect } — extract and do the redirect
		// Forward Set-Cookie headers so the state cookie reaches the browser
		const body = await response.json() as { url?: string; redirect?: boolean };
		if (body.url) {
			const redirectResponse = c.redirect(body.url);
			const setCookie = response.headers.getSetCookie?.() ?? [];
			for (const cookie of setCookie) {
				redirectResponse.headers.append("Set-Cookie", cookie);
			}
			return redirectResponse;
		}
		return c.redirect("iosbetterauthintegration://auth-callback?error=no_redirect");
	});

	app.get("/api/auth/mobile-callback", (c) => {
		const cookie = c.req.header("cookie") || "";
		const match = cookie.match(/better-auth\.session_token=([^;]+)/);
		if (match) {
			const token = match[1];
			return c.redirect(`iosbetterauthintegration://auth-callback?token=${encodeURIComponent(token!)}`);
		}
		return c.redirect("iosbetterauthintegration://auth-callback?error=no_session");
	});

	app.on(["POST", "GET"], "/api/auth/*", (c) => {
		return auth.handler(c.req.raw);
	});

	app.route("/api/v1", appRoutes);

	return app;
}
