# Labrador-functions

Azure Functions TypeScript project with the following functions:

## Functions

### ImportLinkedInToMixpanel
Timer-triggered function that imports LinkedIn ad details into Mixpanel once per day at 7:00 AM.

**Environment variables** (set in Azure or `local.settings.json` for local runs):
- `LINKEDIN_ACCESS_TOKEN` – OAuth bearer token for LinkedIn API
- `LINKEDIN_ACCOUNT_ID` – LinkedIn account/ad account id to query
- `LINKEDIN_API_URL` – (optional) LinkedIn API endpoint to query (default provided)
- `MIXPANEL_TOKEN` – Mixpanel project token

### MixpanelProxy
HTTP-triggered proxy function that forwards requests to the Mixpanel API with CORS support for testwithlabrador.com domains.

**Route**: `/api/mp/{*path}` (forwards to `https://api.mixpanel.com/{path}`)  
**Methods**: GET, POST, OPTIONS  
**Auth Level**: Anonymous

This proxy enables client-side Mixpanel tracking from the Labrador web application while avoiding CORS restrictions.

Quick setup:

```bash
cd Labrador-functions
npm install
npm run build
# Run locally (requires Azure Functions Core Tools):
func start
```

## Notes
- The LinkedIn API request in `ImportLinkedInToMixpanel/index.ts` is a minimal example. Adjust query params and fields to match the LinkedIn Marketing API endpoints you need.
- The ImportLinkedInToMixpanel function maps LinkedIn ad objects to Mixpanel events and posts them to `https://api.mixpanel.com/track` using the project token. If you prefer the Import API or a different format, adapt the payload accordingly.
- The MixpanelProxy function allows only requests from `testwithlabrador.com` domains. Update the `ALLOWED_ORIGINS` array in `MixpanelProxy/index.ts` to add or modify allowed domains.
