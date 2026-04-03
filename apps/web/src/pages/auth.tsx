import { useState } from "react";
import { useNavigate } from "react-router";
import { authClient, saveSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [otp, setOtp] = useState("");
	const [step, setStep] = useState<"email" | "otp">("email");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleSendOTP = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		const { error } = await authClient.emailOtp.sendVerificationOtp({
			email,
			type: "sign-in",
		});

		setLoading(false);
		if (error) {
			setError(error.message ?? "Failed to send OTP");
		} else {
			setStep("otp");
		}
	};

	const handleVerifyOTP = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		const { data, error } = await authClient.signIn.emailOtp({
			email,
			otp,
		});

		setLoading(false);
		if (error) {
			setError(error.message ?? "Invalid OTP");
		} else if (data) {
			saveSession({
				id: data.user.id,
				email: data.user.email,
				name: data.user.name,
			});
			navigate("/");
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-sm">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl">Sign In</CardTitle>
					<CardDescription>
						{step === "email"
							? "Enter your email to receive a login code"
							: `We sent a code to ${email}`}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{step === "email" ? (
						<form onSubmit={handleSendOTP} className="space-y-4">
							<Input
								type="email"
								placeholder="you@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								autoFocus
							/>
							{error && <p className="text-sm text-destructive">{error}</p>}
							<Button type="submit" className="w-full" disabled={loading}>
								{loading && <Loader2 className="h-4 w-4 animate-spin" />}
								Send Code
							</Button>
						</form>
					) : (
						<form onSubmit={handleVerifyOTP} className="space-y-4">
							<Input
								type="text"
								placeholder="Enter 6-digit code"
								value={otp}
								onChange={(e) => setOtp(e.target.value)}
								required
								autoFocus
								maxLength={6}
								className="text-center text-lg tracking-widest"
							/>
							{error && <p className="text-sm text-destructive">{error}</p>}
							<Button type="submit" className="w-full" disabled={loading}>
								{loading && <Loader2 className="h-4 w-4 animate-spin" />}
								Verify & Sign In
							</Button>
							<Button
								type="button"
								variant="ghost"
								className="w-full"
								onClick={() => {
									setStep("email");
									setOtp("");
									setError("");
								}}
							>
								Use a different email
							</Button>
						</form>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
