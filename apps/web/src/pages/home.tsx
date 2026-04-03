import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { authClient, getLocalSession, saveSession, clearSession, type LocalSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LogOut } from "lucide-react";

export default function HomePage() {
	const navigate = useNavigate();
	const [session, setSession] = useState<LocalSession | null>(getLocalSession);
	const [loading, setLoading] = useState(!session);

	useEffect(() => {
		if (session) return;

		// No local session — check server (handles OAuth callback redirect)
		authClient.getSession().then(({ data }) => {
			if (data?.user) {
				saveSession({
					id: data.user.id,
					email: data.user.email,
					name: data.user.name,
				});
				setSession(getLocalSession());
			} else {
				navigate("/auth");
			}
			setLoading(false);
		});
	}, [session, navigate]);

	const handleSignOut = async () => {
		await authClient.signOut();
		clearSession();
		navigate("/auth");
	};

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-muted-foreground">Loading...</p>
			</div>
		);
	}

	if (!session) {
		return null;
	}

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-2xl">Welcome</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-1">
						<p className="text-sm text-muted-foreground">Signed in as</p>
						<p className="font-medium">{session.user.email}</p>
						{session.user.name && (
							<p className="text-sm text-muted-foreground">{session.user.name}</p>
						)}
					</div>
					<Button variant="outline" className="w-full" onClick={handleSignOut}>
						<LogOut className="h-4 w-4" />
						Sign Out
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
