import { provisionOrganization, syncEntitlementEvent } from "../services/provisioning.service.js";

export const provisionOrganizationHandler = async (req, res) => {
  try {
    const result = await provisionOrganization(req.integrationPayload);
    if (!result.ok) {
      return res.status(result.status || 400).json({
        success: false,
        message: result.message,
      });
    }
    return res.status(200).json({
      success: true,
      data: result.data,
      warnings: result.warnings,
    });
  } catch (error) {
    console.error("Integration provisioning failed:", error);
    return res.status(500).json({
      success: false,
      message: "Organization provisioning failed. Retry is safe.",
    });
  }
};

export const entitlementEventHandler = async (req, res) => {
  try {
    const result = await syncEntitlementEvent(req.integrationPayload);
    if (!result.ok) {
      return res.status(result.status || 400).json({
        success: false,
        message: result.message,
      });
    }
    return res.status(200).json({ success: true, data: result.data });
  } catch (error) {
    console.error("Entitlement sync failed:", error);
    return res.status(500).json({
      success: false,
      message: "Entitlement sync failed. Retry is safe.",
    });
  }
};
