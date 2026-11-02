import { acceptInvitation, previewInvitation } from "../services/invitation.service.js";

export const preview = async (req, res) => {
  try {
    const invitation = await previewInvitation(req.params.token);
    if (!invitation) {
      return res.status(404).json({ success: false, message: "This invitation link is invalid." });
    }
    return res.status(200).json({ success: true, data: invitation });
  } catch (error) {
    console.error("Invitation preview failed:", error);
    return res.status(500).json({ success: false, message: "Could not load the invitation." });
  }
};

export const accept = async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token) {
      return res.status(400).json({ success: false, message: "Invitation token is required." });
    }
    const user = await acceptInvitation(token, password);
    return res.status(200).json({
      success: true,
      message: "Your account is ready. You can sign in now.",
      user: {
        id: user.user_id,
        name: user.user_name,
        email: user.user_email,
        role: user.user_role,
        tenantId: user.tenant_fk,
      },
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.status ? error.message : "Could not activate the account.",
    });
  }
};
