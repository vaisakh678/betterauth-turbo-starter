import { Hono } from "hono";
import healthRoute from "./health-route";

const appRoutes = new Hono();

appRoutes.route("/health", healthRoute);

export default appRoutes;
