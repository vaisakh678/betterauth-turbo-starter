import { useNavigate } from "react-router";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LogOut } from "lucide-react";

export default function HomePage() {
	const navigate = useNavigate();
	const { data: session, isPending } = authClient.useSession();

	const handleSignOut = async () => {
		await authClient.signOut();
		navigate("/auth");
	};

	if (isPending) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-muted-foreground">Loading...</p>
			</div>
		);
	}

	if (!session) {
		navigate("/auth");
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
