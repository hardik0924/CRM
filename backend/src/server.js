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
import dashboardRoutes from "./routes/dashboard.routes.js";
import tenantRoutes from "./routes/tenant.routes.js";
import integrationRoutes from "./routes/integration.routes.js";
import invitationRoutes from "./routes/invitation.routes.js";
import organizationRoutes from "./routes/organization.routes.js";
import { authMiddleware } from "./middleware/auth.middleware.js";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(cors());

// Integration routes need the raw body for HMAC verification, so they must be
// mounted before the JSON parser. They never accept a user session.
app.use("/api/integrations", integrationRoutes);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/organization", organizationRoutes);

// Auth middleware for all data routes (tenant isolation + entitlement)
app.use("/api/users", authMiddleware);
app.use("/api/accounts", authMiddleware);
app.use("/api/contacts", authMiddleware);
app.use("/api/opportunities", authMiddleware);
app.use("/api/projects", authMiddleware);
app.use("/api/search", authMiddleware);
app.use("/api/calls", authMiddleware);
app.use("/api/tasks", authMiddleware);
app.use("/api/dashboard", authMiddleware);
app.use("/api/tenants", tenantRoutes);

app.use("/api/users", userRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/opportunities", opportunityRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/calls", callRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
  res.send("CRM API Running");
});

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
