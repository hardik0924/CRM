import { verifyIntegrationRequest } from "../lib/onboarding.logic.js";

/**
 * Verifies HMAC signature + timestamp over the raw request body.
 * Mount this with express.raw so the signature is checked on exact bytes.
 */
export const verifyIntegration = (req, res, next) => {
  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";

  const result = verifyIntegrationRequest({
    rawBody,
    headers: req.headers,
    secret: process.env.INTEGRATION_HMAC_SECRET,
    apiKey: process.env.INTEGRATION_API_KEY,
    maxSkewSeconds: Number(process.env.INTEGRATION_MAX_SKEW_SECONDS || 300),
    nodeEnv: process.env.NODE_ENV || "development",
  });

  if (!result.ok) {
    return res.status(401).json({ success: false, message: result.reason });
  }

  try {
    req.integrationPayload = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return res.status(400).json({ success: false, message: "Request body must be valid JSON" });
  }

  req.integrationMode = result.mode;
  next();
};
