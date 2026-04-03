import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP, jwt } from "better-auth/plugins";
import db from "@repo/db";

export const auth = betterAuth({
	baseURL: process.env.BETTER_AUTH_URL,
	secret: process.env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
	advanced: {
		database: {
			generateId: false,
		}
	},
	trustedOrigins: ["http://localhost:5173", "http://localhost:3001", "iosbetterauthintegration://", "androidbetterauthintegration://"],
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		},
		apple: {
			clientId: process.env.APPLE_CLIENT_ID!,
			clientSecret: process.env.APPLE_CLIENT_SECRET!,
		},
	},
	plugins: [
		emailOTP({
			async sendVerificationOTP({ email, otp, type }) {
				// TODO: implement email sending (Resend, SendGrid, etc.)
				console.log(`[OTP] ${type} → ${email}: ${otp}`);
			},
		}),
		jwt(),
	],
});
