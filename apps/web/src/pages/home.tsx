import { useEffect } from "react";
import { useNavigate } from "react-router";
import { authClient, getLocalSession, clearSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LogOut } from "lucide-react";

export default function HomePage() {
	const navigate = useNavigate();
	const session = getLocalSession();

	useEffect(() => {
		if (!session) {
			navigate("/auth");
		}
	}, [session, navigate]);

	const handleSignOut = async () => {
		await authClient.signOut();
		clearSession();
		navigate("/auth");
	};

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
