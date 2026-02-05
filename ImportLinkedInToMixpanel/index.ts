import axios from "axios";

const linkedinApiUrl = process.env.LINKEDIN_API_URL || "https://api.linkedin.com/v2/adAnalyticsV2";
const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
const accountId = process.env.LINKEDIN_ACCOUNT_ID;
const mixpanelToken = process.env.MIXPANEL_TOKEN;

const timerTrigger = async function (context: any, myTimer: any): Promise<void> {
  context.log('ImportLinkedInToMixpanel started at', new Date().toISOString());

  if (!accessToken || !accountId || !mixpanelToken) {
    context.log.error("Missing required environment variables. Set LINKEDIN_ACCESS_TOKEN, LINKEDIN_ACCOUNT_ID, and MIXPANEL_TOKEN.");
    return;
  }

  try {
    // Fetch LinkedIn ad data: customize query/fields to your needs
    const res = await axios.get(linkedinApiUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { q: 'analytics', account: accountId }
    });

    const ads = Array.isArray(res.data.elements) ? res.data.elements : (Array.isArray(res.data) ? res.data : [res.data]);

    if (!ads || ads.length === 0) {
      context.log('No ad data returned from LinkedIn.');
      return;
    }

    const events = ads.map((ad: any) => ({
      event: "LinkedIn Ad Import",
      properties: {
        token: mixpanelToken,
        distinct_id: ad.id || ad.adAccount || accountId,
        adId: ad.id || null,
        campaign: ad.campaignName || ad.campaign || null,
        impressions: ad.impressions || null,
        clicks: ad.clicks || null,
        cost: ad.cost || null,
        imported_at: new Date().toISOString()
      }
    }));

    const payload = Buffer.from(JSON.stringify(events)).toString('base64');
    const mixpanelRes = await axios.post('https://api.mixpanel.com/track', `data=${encodeURIComponent(payload)}`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    context.log('Sent', events.length, 'events to Mixpanel. Response:', mixpanelRes.status, mixpanelRes.data);
  } catch (err: any) {
    context.log.error('Error importing LinkedIn data:', err?.response?.data || err.message || err);
  }
};

export default timerTrigger;
