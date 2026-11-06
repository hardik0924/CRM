import express from "express";
import authRoutes from "./routes/auth.routes.js";
import accountRoutes from "./routes/account.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import opportunityRoutes from "./routes/opportunity.routes.js";
import userRoutes from "./routes/user.routes.js";
import projectRoutes from "./routes/project.routes.js";
import searchRoutes from "./routes/search.routes.js";
import callRoutes from "./routes/call.routes.js";
import taskRoutes from "./routes/task.routes.js";
import campaignRoutes from "./routes/campaign.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import tenantRoutes from "./routes/tenant.routes.js";
import integrationRoutes from "./routes/integration.routes.js";
import invitationRoutes from "./routes/invitation.routes.js";
import organizationRoutes from "./routes/organization.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import { authMiddleware, requireModule } from "./middleware/auth.middleware.js";
import cors from "cors";
import dotenv from "dotenv";
import { pathToFileURL } from "node:url";

dotenv.config();

const app = express();
const port = process.env.PORT;

// Explicit browser origins only. CORS decides which pages may read responses;
// it is not the authentication boundary.
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter((origin) => origin && origin !== "*");

app.use(
  cors({
    origin: (origin, callback) =>
      callback(null, !origin || allowedOrigins.includes(origin.replace(/\/$/, ""))),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  })
);

// Integration routes need the raw body for HMAC verification, so they must be
// mounted before the JSON parser. They never accept a user session.
app.use("/api/integrations", integrationRoutes);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/organization", organizationRoutes);

// Auth middleware for all data routes (tenant isolation + entitlement)
app.use("/api/users", authMiddleware);
app.use("/api/accounts", authMiddleware, requireModule("ACCOUNTS"));
app.use("/api/contacts", authMiddleware, requireModule("CONTACTS"));
app.use("/api/opportunities", authMiddleware, requireModule("OPPORTUNITIES"));
app.use("/api/projects", authMiddleware, requireModule("PROJECTS"));
app.use("/api/search", authMiddleware);
app.use("/api/calls", authMiddleware);
app.use("/api/tasks", authMiddleware, requireModule("TASKS"));
app.use("/api/campaigns", authMiddleware, requireModule("CAMPAIGNS"));
app.use("/api/dashboard", authMiddleware);
app.use("/api/activity", authMiddleware);
app.use("/api/tenants", tenantRoutes);

app.use("/api/users", userRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/opportunities", opportunityRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/calls", callRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/activity", activityRoutes);

app.get("/", (req, res) => {
  res.send("CRM API Running");
});

export { app };

// Only listen when this file is the process entry point, so tests can import
// the app without opening a port.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${port} is already in use!`);
      console.error(`This usually happens if another terminal is running the server, or nodemon restarted too quickly.`);
      process.exit(1);
    } else {
      console.error('❌ Server error:', error);
    }
  });
}

