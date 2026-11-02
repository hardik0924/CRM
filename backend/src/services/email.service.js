/**
 * Email adapter with no new dependency.
 * - If EMAIL_WEBHOOK_URL is configured, POST the message there.
 * - Otherwise in development, print the invitation URL to the server console.
 * - In production with no provider, fail loudly without logging the token.
 */
export const sendInvitationEmail = async ({ to, name, organizationName, inviteUrl }) => {
  const subject = `You are invited to ${organizationName} on VSPH CRM`;
  const text = [
    `Hello${name ? ` ${name}` : ""},`,
    "",
    `You have been invited to join ${organizationName} on VSPH CRM.`,
    "Open this link to set your password and activate your account:",
    inviteUrl,
    "",
    "This link can be used once and expires soon. If you were not expecting it, ignore this email.",
  ].join("\n");

  const webhook = process.env.EMAIL_WEBHOOK_URL;
  if (webhook) {
    const response = await fetch(webhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.EMAIL_WEBHOOK_TOKEN
          ? { Authorization: `Bearer ${process.env.EMAIL_WEBHOOK_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({ to, subject, text }),
    });
    if (!response.ok) {
      throw new Error(`Email provider rejected the message (${response.status})`);
    }
    return { delivered: true, transport: "webhook" };
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("No email provider configured. Set EMAIL_WEBHOOK_URL.");
  }

  // Development-only fallback. Never log the token in production.
  console.log(`[invite:dev] ${to} -> ${inviteUrl}`);
  return { delivered: false, transport: "console", devInviteUrl: inviteUrl };
};
