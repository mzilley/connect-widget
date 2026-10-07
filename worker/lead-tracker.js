// Drop into the connect widget Worker. Call it after the HCP lead is created,
// inside ctx.waitUntil so the visitor never waits on it:
//
//   ctx.waitUntil(sendToLeadTracker(env, {
//     hcp_lead_id: hcpLead.id,
//     lead_type: "Chat",            // Chat | Text | Call | Email
//     phone, email, name,
//     gclid, utm_source, utm_medium, utm_campaign, landing_page,
//   }));
//
// Needs the LEADS service binding and the INTAKE_SECRET secret (see README).

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sendToLeadTracker(env, fields) {
  try {
    const body = JSON.stringify({ origin: "widget", submitted_at: new Date().toISOString(), ...fields });
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = await hmacHex(env.INTAKE_SECRET, `${timestamp}.${body}`);
    // The hostname is ignored on a service binding; the path is what routes.
    const res = await env.LEADS.fetch("https://elite/intake", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-elite-timestamp": timestamp,
        "x-elite-signature": signature,
      },
      body,
    });
    if (!res.ok) console.error("lead tracker rejected", res.status, await res.text());
  } catch (err) {
    // Never let attribution break the widget; HCP's notes remain the fallback.
    console.error("lead tracker unreachable", err);
  }
}
