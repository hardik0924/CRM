import crypto from "node:crypto";

export const CLIENT_ROLES = [
  "ADMIN",
  "SALES",
  "DATA",
  "PRODUCTION",
  "SPONSORSHIP",
  "OPERATION",
  "USER",
];

export const ENTITLEMENT_STATUSES = [
  "ACTIVE",
  "SUSPENDED",
  "EXPIRED",
  "REVOKED",
  "PENDING",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isEmail = (value) =>
  typeof value === "string" && EMAIL_RE.test(value.trim());

export const isClientRole = (role) => CLIENT_ROLES.includes(role);

export const normalizeEntitlementStatus = (value) => {
  const status = String(value || "").trim().toUpperCase();
  if (["ACTIVE", "ENABLED", "TRUE", "1"].includes(status)) return "ACTIVE";
  if (["SUSPENDED", "PAUSED"].includes(status)) return "SUSPENDED";
  if (["EXPIRED", "ENDED"].includes(status)) return "EXPIRED";
  if (["REVOKED", "CANCELLED", "CANCELED"].includes(status)) return "REVOKED";
  return "PENDING";
};

const pick = (source, keys) => {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return undefined;
};

const pickDate = (source, keys) => {
  const raw = pick(source, keys);
  if (!raw) return undefined;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

/**
 * Accepts the contract field names plus common aliases so the central platform
 * can adopt the final naming without a CRM redeploy.
 */
export const normalizeProvisionPayload = (body = {}) => {
  const normalized = {
    externalOrganizationId: pick(body, [
      "externalOrganizationId",
      "external_organization_id",
      "organizationId",
      "organization_id",
      "externalOrgId",
    ]),
    organizationName: pick(body, [
      "organizationName",
      "organization_name",
      "name",
      "tenantName",
    ]),
    organizationCode: pick(body, [
      "organizationCode",
      "organization_code",
      "code",
      "tenantCode",
    ]),
    primaryAdminEmail: pick(body, [
      "primaryAdminEmail",
      "primary_admin_email",
      "adminEmail",
      "admin_email",
      "email",
    ])?.toLowerCase(),
    primaryAdminName: pick(body, [
      "primaryAdminName",
      "primary_admin_name",
      "adminName",
      "admin_name",
    ]),
    crmEntitlementStatus: normalizeEntitlementStatus(
      pick(body, [
        "crmEntitlementStatus",
        "crm_entitlement_status",
        "entitlementStatus",
        "entitlement_status",
        "status",
      ]) || "ACTIVE",
    ),
    subscriptionReference: pick(body, [
      "subscriptionReference",
      "subscription_reference",
      "subscriptionRef",
      "subscription_id",
    ]),
    effectiveStart: pickDate(body, ["effectiveStart", "effective_start", "startDate"]),
    effectiveEnd: pickDate(body, ["effectiveEnd", "effective_end", "endDate", "expiresAt"]),
    plan: pick(body, ["plan", "subscriptionPlan", "tenantPlan"]),
  };

  const errors = [];
  if (!normalized.externalOrganizationId) {
    errors.push("externalOrganizationId is required");
  }
  if (!normalized.organizationName) {
    errors.push("organizationName is required");
  }
  if (normalized.primaryAdminEmail && !isEmail(normalized.primaryAdminEmail)) {
    errors.push("primaryAdminEmail is not a valid email address");
  }

  return { value: normalized, errors };
};

export const sanitizeTenantCode = (value, fallbackSeed = "") => {
  const clean = String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 40);
  if (clean) return clean;
  const seed = String(fallbackSeed || "").replace(/[^a-zA-Z0-9]/g, "");
  return `EXT${seed.slice(-6).toUpperCase() || Math.floor(Math.random() * 1e6)}`;
};

/** Plain HMAC over `timestamp.rawBody`, hex encoded. */
export const signIntegrationPayload = (timestamp, rawBody, secret) =>
  crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

export const secureCompare = (a, b) => {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
};

/**
 * Verifies signature + timestamp. Returns { ok, reason }.
 * Dev key fallback is only allowed when not production.
 */
export const verifyIntegrationRequest = ({
  rawBody = "",
  headers = {},
  secret,
  apiKey,
  maxSkewSeconds = 300,
  now = Date.now(),
  nodeEnv = "development",
}) => {
  const isProduction = nodeEnv === "production";
  const providedKey = headers["x-integration-key"];

  if (!isProduction && apiKey && providedKey && secureCompare(providedKey, apiKey)) {
    return { ok: true, mode: "dev-key" };
  }

  if (!secret) {
    return { ok: false, reason: "Integration secret is not configured" };
  }

  const timestamp = headers["x-vsph-timestamp"];
  const signature = String(headers["x-vsph-signature"] || "").replace(/^sha256=/i, "");
  if (!timestamp || !signature) {
    return { ok: false, reason: "Missing integration signature headers" };
  }

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) {
    return { ok: false, reason: "Invalid integration timestamp" };
  }
  if (Math.abs(Math.floor(now / 1000) - ts) > maxSkewSeconds) {
    return { ok: false, reason: "Integration timestamp expired" };
  }

  const expected = signIntegrationPayload(timestamp, rawBody, secret);
  if (!secureCompare(signature, expected)) {
    return { ok: false, reason: "Invalid integration signature" };
  }
  return { ok: true, mode: "hmac" };
};

/**
 * Fail-closed CRM access decision. Superadmin support access always works.
 * `enforce` is only false in explicit local development.
 */
export const evaluateCrmAccess = ({ role, tenant, entitlement, enforce = true, now = new Date() }) => {
  if (role === "SUPER_ADMIN") return { allowed: true, reason: "internal_admin" };
  if (!tenant) return { allowed: false, reason: "no_tenant" };
  if (tenant.tenant_status !== "ACTIVE") {
    return { allowed: false, reason: "tenant_inactive" };
  }
  if (!enforce) return { allowed: true, reason: "enforcement_disabled" };
  if (!entitlement) return { allowed: false, reason: "entitlement_unknown" };
  if (entitlement.entitlement_status !== "ACTIVE") {
    return { allowed: false, reason: `entitlement_${entitlement.entitlement_status.toLowerCase()}` };
  }
  if (entitlement.effective_end && new Date(entitlement.effective_end) < now) {
    return { allowed: false, reason: "entitlement_expired" };
  }
  return { allowed: true, reason: "entitlement_active" };
};

export const isEntitlementEnforced = (value) => String(value ?? "true").toLowerCase() !== "false";

export const generateInvitationToken = () => crypto.randomBytes(32).toString("base64url");

export const hashInvitationToken = (token) =>
  crypto.createHash("sha256").update(String(token)).digest("hex");

export const isInvitationUsable = (invitation, now = new Date()) =>
  Boolean(
    invitation &&
      invitation.invitation_status === "PENDING" &&
      new Date(invitation.invitation_expires_at) > now
  );

export const validateNewPassword = (password) => {
  if (typeof password !== "string" || password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  return null;
};

export const buildInviteUrl = (token, baseUrl) => {
  const base = String(baseUrl || "http://localhost:5173").replace(/\/+$/, "");
  return `${base}/accept-invite?token=${encodeURIComponent(token)}`;
};
