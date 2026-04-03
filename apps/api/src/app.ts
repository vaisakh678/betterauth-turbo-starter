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

	// Mobile Google OAuth — initiates the flow for iOS/Android
	app.get("/api/auth/mobile/google", async (c) => {
		const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3001";
		const platform = c.req.query("platform") || "ios";
		const callbackURL = `${baseUrl}/api/auth/mobile-callback?platform=${platform}`;
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

		const body = await response.json() as { url?: string; redirect?: boolean };
		if (body.url) {
			const redirectResponse = c.redirect(body.url);
			const setCookie = response.headers.getSetCookie?.() ?? [];
			for (const cookie of setCookie) {
				redirectResponse.headers.append("Set-Cookie", cookie);
			}
			return redirectResponse;
		}
		const scheme = platform === "android" ? "androidbetterauthintegration" : "iosbetterauthintegration";
		return c.redirect(`${scheme}://auth-callback?error=no_redirect`);
	});

	// Alias for Android
	app.get("/api/auth/mobile/google-android", async (c) => {
		const url = new URL(c.req.url);
		url.pathname = "/api/auth/mobile/google";
		url.searchParams.set("platform", "android");
		return app.fetch(new Request(url.toString(), { headers: c.req.raw.headers }));
	});

	// Mobile OAuth callback — extracts session token and redirects to app
	app.get("/api/auth/mobile-callback", (c) => {
		const platform = c.req.query("platform") || "ios";
		const scheme = platform === "android" ? "androidbetterauthintegration" : "iosbetterauthintegration";
		const cookie = c.req.header("cookie") || "";
		const match = cookie.match(/better-auth\.session_token=([^;]+)/);
		if (match) {
			const token = match[1];
			return c.redirect(`${scheme}://auth-callback?token=${encodeURIComponent(token!)}`);
		}
		return c.redirect(`${scheme}://auth-callback?error=no_session`);
	});

	app.on(["POST", "GET"], "/api/auth/*", (c) => {
		return auth.handler(c.req.raw);
	});

	app.route("/api/v1", appRoutes);

	return app;
}
