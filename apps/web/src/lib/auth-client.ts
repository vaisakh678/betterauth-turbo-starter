import { createAuthClient } from "better-auth/react";
import { emailOTPClient, jwtClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
	baseURL: "http://localhost:3001",
	plugins: [emailOTPClient(), jwtClient()],
});

const SESSION_KEY = "auth_session";

export interface LocalSession {
	user: { id: string; email: string; name: string };
}

export function saveSession(user: { id: string; email: string; name: string }) {
	localStorage.setItem(SESSION_KEY, JSON.stringify({ user }));
}

export function getLocalSession(): LocalSession | null {
	try {
		const raw = localStorage.getItem(SESSION_KEY);
		if (!raw) return null;
		return JSON.parse(raw) as LocalSession;
	} catch {
		return null;
	}
}

export function clearSession() {
	localStorage.removeItem(SESSION_KEY);
}
