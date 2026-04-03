import { Hono } from "hono";

const healthRoute = new Hono();

healthRoute.get("/", (c) => {
	return c.json({ data: { status: "ok" }, message: "Server is running" });
});

export default healthRoute;
