import { serve } from "@hono/node-server";
import { createApp } from "./app";

const app = createApp();

const server = serve({ fetch: app.fetch, port: 3001 }, (info) => {
	console.log(`Server running at http://localhost:${info.port}`);
});

const shutdown = () => {
	server.close(() => process.exit(0));
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
