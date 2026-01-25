import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import "./env";
import { auth } from "./auth";
import { cashRequestRouter } from "./routes/cash-requests";
import { usersRouter } from "./routes/users";
import { categoryRouter } from "./routes/categories";
import { reportsRouter } from "./routes/reports";
import { uploadRouter } from "./routes/upload";

// Type the Hono app with user/session variables
const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// CORS middleware - validates origin against allowlist
const allowed = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  "http://localhost:8000"
];

app.use(
  "*",
  cors({
    origin: (origin) => (origin && allowed.some((re) => (re instanceof RegExp ? re.test(origin) : re === origin)) ? origin : null),
    credentials: true,
  })
);

// Logging
app.use("*", logger());

// Auth middleware - populates user/session for all routes
app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    c.set("user", null);
    c.set("session", null);
    await next();
    return;
  }
  c.set("user", session.user);
  c.set("session", session.session);
  await next();
});

// Mount auth handler
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Health check endpoint
app.get("/health", (c) => c.json({ status: "ok" }));

// API Routes
app.route("/api/cash-requests", cashRequestRouter);
app.route("/api/users", usersRouter);
app.route("/api/categories", categoryRouter);
app.route("/api/reports", reportsRouter);
app.route("/api/upload", uploadRouter);

import { serveStatic } from "@hono/node-server/serve-static";

// Serve uploaded files
app.use("/uploads/*", serveStatic({
  root: "./",
  rewriteRequestPath: (path) => path, // Hono node-server serveStatic might need path adjustment or root config
}));

import { serve } from "@hono/node-server";

const port = Number(process.env.PORT) || 3000;
console.log(`Server is running on port ${port}`);

if (!process.env.VERCEL) {
  serve({
    fetch: app.fetch,
    port
  });
}

export default app;
