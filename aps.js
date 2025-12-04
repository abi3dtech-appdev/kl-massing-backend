// aps.js - simple helper to get an APS access token (2-legged)

const APS_AUTH_URL = "https://developer.api.autodesk.com/authentication/v2/token";

export async function getApsToken() {
  const clientId = process.env.APS_CLIENT_ID;
  const clientSecret = process.env.APS_CLIENT_SECRET;
  const scopes = process.env.APS_SCOPES || "data:create data:write data:read";

  if (!clientId || !clientSecret) {
    throw new Error("APS_CLIENT_ID or APS_CLIENT_SECRET is not set.");
  }

  const body = new URLSearchParams();
  body.append("grant_type", "client_credentials");
  body.append("client_id", clientId);
  body.append("client_secret", clientSecret);
  body.append("scope", scopes);

  const res = await fetch(APS_AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`APS token request failed: ${res.status} ${res.statusText} - ${text}`);
  }

  const json = await res.json();
  return json.access_token;
}
