---
name: NutAI API routing
description: Replit Expo web preview routes same-origin /api requests to the API server.
---

For this app, a browser request to `/api/...` on the Expo web origin reaches the API server. Use a relative same-origin URL for web NutAI requests; native iOS and Android must use the configured absolute API host.

**Why:** The earlier cross-origin browser request stalled at preflight even though the API returned valid CORS headers. Same-origin requests avoid that browser preflight.

**How to apply:** When adding web API calls in the Expo app, prefer `/api/...` and verify the path reaches the API server. Keep absolute API-host URLs for native clients.
