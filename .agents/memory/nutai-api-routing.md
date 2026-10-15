---
name: NutAI API routing
description: Replit Expo web preview routes same-origin /api requests to the API server.
---

For this app, a browser request to `/api/...` on the Expo web origin reaches the API server. Use a relative same-origin URL for web NutAI requests; native iOS and Android must use the configured absolute API host.

**Why:** The earlier cross-origin browser request stalled at preflight even though the API returned valid CORS headers. Same-origin requests avoid that browser preflight.

**How to apply:** When adding web API calls in the Expo app, prefer `/api/...` and verify the path reaches the API server. Keep absolute API-host URLs for native clients.

The API server uses a configurable OpenAI-compatible Chat Completions provider. It requires `NUTAI_PROVIDER_BASE_URL`, `NUTAI_PROVIDER_MODEL`, and the secret `NUTAI_PROVIDER_API_KEY`. Never fall back to `OPENAI_API_KEY` when targeting a custom host.

**Why:** Sending an OpenAI key to a different provider host would expose credentials to an unintended recipient, and a saved secret may not be active in an already-running process.

**How to apply:** Collect the provider base URL and model as environment variables and the provider key through the secure Secrets flow. After configuration, restart the API Server workflow and confirm only the safe configuration booleans; never print or inspect the key.
