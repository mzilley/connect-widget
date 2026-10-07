# Connect Widget API Worker

A Cloudflare Worker that receives form submissions from the Connect Widget and creates leads in HouseCall Pro.

## What It Does

When someone submits the "Text Us" form in the Connect Widget:
1. The worker receives the form data
2. Searches for an existing customer in HouseCall Pro (by email or phone)
3. Creates a new customer if not found
4. Creates a lead in HouseCall Pro's Job Inbox (API Leads channel)

This creates a lead in HCP just like your WordPress form does!

> **Note:** The "Text Us" form only *creates a lead* in HouseCall Pro — it does **not** send an SMS to the customer. See [Known Limitations](#known-limitations).

## Setup Instructions

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

This will open a browser to authenticate with your Cloudflare account.

### 3. Deploy the Worker

```bash
cd worker
wrangler deploy
```

After deployment, you'll get a URL like:
```
https://connect-widget-api.YOUR_SUBDOMAIN.workers.dev
```

### 4. Set Environment Variables

In the Cloudflare dashboard:

1. Go to **Workers & Pages**
2. Click on your `connect-widget-api` worker
3. Go to **Settings** → **Variables**
4. Add the following **Environment Variables**:

| Variable | Value | Description |
|----------|-------|-------------|
| `HCP_API_KEY` | `your-api-key` | Your HouseCall Pro API key (same as in wp-config.php) |
| `ALLOWED_ORIGINS` | `https://yoursite.com,https://www.yoursite.com` | Comma-separated list of allowed origins |

**Important:** Click "Encrypt" for the `HCP_API_KEY` to keep it secure.

### 5. Update Your Widget Configuration

Update the Connect Widget config on your website:

```javascript
window.ConnectWidgetConfig = {
    // ... other config
    hcpWorkerUrl: 'https://connect-widget-api.YOUR_SUBDOMAIN.workers.dev',
};
```

## Testing

You can test the worker with curl:

```bash
curl -X POST https://connect-widget-api.YOUR_SUBDOMAIN.workers.dev \
  -H "Content-Type: application/json" \
  -H "Origin: https://yoursite.com" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "phone": "(555) 123-4567",
    "canText": "Yes",
    "message": "This is a test message from the API",
    "pageUrl": "https://yoursite.com/test"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Lead created successfully",
  "customerId": "cus_xxxxx",
  "leadId": "lea_xxxxx"
}
```

## API Reference

### POST /

Creates a lead in HouseCall Pro.

**Request Body (JSON):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `firstName` | string | Yes | Customer's first name |
| `lastName` | string | No | Customer's last name |
| `phone` | string | Yes* | Phone number (formatted or unformatted) |
| `email` | string | Yes* | Email address |
| `canText` | string | No | Text consent (Yes/No), Text form |
| `bestTimeToCall` | string | No | Preferred call window, Callback form |
| `message` | string | Yes† | Issue description |
| `pageUrl` | string | No | Page URL where form was submitted |
| `formType` | string | No | `Connect Widget - Text`, `Connect Widget - Email` or `Connect Widget - Callback` |
| `gclid`, `utmSource`, `utmMedium`, `utmCampaign`, `landingPage`, `referrer` | string | No | Attribution captured by the widget; added to the lead note and sent to elite |
| `website` | string | No | Honeypot. Must be empty; if filled, the worker returns success and creates nothing |
| `street` | string | No | Street address |
| `city` | string | No | City |
| `state` | string | No | State |
| `zip` | string | No | ZIP code |

*At least one of `phone` or `email` is required. Each form also has its own requirements:

| `formType` | Requires | elite `lead_type` |
|---|---|---|
| `Connect Widget - Text` | `phone`, `message` | Text |
| `Connect Widget - Email` | `email`, `message` | Email |
| `Connect Widget - Callback` | `phone` | Call |

†`message` is required for the Text and Email forms and optional for Callback.

## elite lead tracker

After each HCP lead is created, the worker sends a signed copy of it (HCP lead and customer IDs, lead type, contact details and attribution) to the elite Worker over the `LEADS` service binding, using `ctx.waitUntil` so the visitor never waits. Failures are logged and ignored; the HCP lead note keeps the attribution either way.

Setup:

1. Deploy elite first, on the same Cloudflare account. The `[[services]]` binding in `wrangler.toml` must resolve or this worker won't deploy.
2. Give this worker the same secret as elite: `npx wrangler secret put INTAKE_SECRET`.
3. Deploy this worker.

If the `LEADS` binding is missing, the worker skips the copy and still creates HCP leads.

**Response:**

```json
{
  "success": true,
  "message": "Lead created successfully",
  "customerId": "cus_xxxxx",
  "leadId": "lea_xxxxx"
}
```

## Known Limitations

### The "Text Us" form does not send an SMS

The Text Us form **creates a lead** in the HouseCall Pro Job Inbox (with the customer's
message in the note) — but it does **not** send a text message to the customer. The button
label and the "Can we text you?" question imply a two-way text conversation that the backend
does not actually start.

**Why:** HouseCall Pro's public REST API has no documented endpoint for sending outbound
SMS. The worker can only create customers and leads, so the outbound-text step was never
built. Sending a real SMS would require adding a third-party provider (e.g. Twilio) with its
own account, phone number, and credentials.

**Current behavior is intentional and safe** — leads still land in the Job Inbox and can be
followed up on manually. This note exists so the gap between the UI wording and the backend
behavior is on the record.

## Security

- The HCP API key is stored as an encrypted environment variable in Cloudflare
- CORS is configured to only allow requests from specified origins
- The worker validates required fields before making API calls

## Troubleshooting

### "Server configuration error"
The `HCP_API_KEY` environment variable is not set. Check your Cloudflare dashboard.

### "CORS error" in browser
Add your website's origin to the `ALLOWED_ORIGINS` environment variable.

### Lead not appearing in HouseCall Pro
Check the Cloudflare Workers logs:
1. Go to **Workers & Pages** → **connect-widget-api**
2. Click **Logs** tab
3. Look for error messages

## Local Development

```bash
# Run locally with wrangler
wrangler dev

# The worker will be available at http://localhost:8787
```

For local testing, you'll need to pass secrets:
```bash
wrangler dev --var HCP_API_KEY:your-key-here
```
