import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import axios from "axios";

const MIXPANEL_API_BASE = "https://api.mixpanel.com";
const ALLOWED_ORIGINS = [
  "https://testwithlabrador.com",
  "https://www.testwithlabrador.com"
];

const httpTrigger = async function (
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const origin = req.headers.get("origin") || req.headers.get("Origin");
  
  // Set CORS headers
  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
  };

  // Check if origin is allowed
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    corsHeaders["Access-Control-Allow-Origin"] = origin;
    corsHeaders["Access-Control-Allow-Credentials"] = "true";
  }

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return {
      status: 204,
      headers: corsHeaders
    };
  }

  try {
    // Get the path from the route parameter (everything after /api/mp/)
    const path = req.params.path || "";
    const targetUrl = `${MIXPANEL_API_BASE}/${path}`;

    context.log(`Proxying ${req.method} request to: ${targetUrl}`);

    // Get request body
    let body;
    try {
      body = await req.text();
    } catch {
      body = undefined;
    }

    // Forward the request to Mixpanel
    const response = await axios({
      method: req.method as any,
      url: targetUrl,
      params: Object.fromEntries(req.query.entries()),
      data: body,
      headers: {
        "Content-Type": req.headers.get("content-type") || "application/json",
        "User-Agent": "Labrador-MPProxy/1.0"
      },
      validateStatus: () => true // Accept any status code
    });

    // Return the response from Mixpanel
    return {
      status: response.status,
      headers: {
        ...corsHeaders,
        "Content-Type": response.headers["content-type"] || "application/json"
      },
      body: JSON.stringify(response.data)
    };

  } catch (error: any) {
    context.error("Error proxying request to Mixpanel:", error.message);
    
    return {
      status: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Failed to proxy request to Mixpanel",
        message: error.message
      })
    };
  }
};

app.http("MPProxy", {
  methods: ["GET", "POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "mpproxy/{*path}",
  handler: httpTrigger
});

export default httpTrigger;
