const axios = require("axios");

let accessToken = null;
let tokenExpiry = null;

const appId = process.env.CLIENT_ID; // Your App ID
const appSecret = process.env.CLIENT_SECRET; // Your App Secret

console.log("AppId length:", appId.length);
console.log("AppSecret length:", appSecret.length);

async function getAccessToken() {
  if (!accessToken || Date.now() >= tokenExpiry) {
    try {
      const response = await axios.post(
        "https://api.jobs.com/auth/token",
        null,
        {
          params: {
            AppId: appId,
            AppSecret: appSecret,
          },
        }
      );

      // Extract the token and expiration time
      accessToken = response.data.Token;
      const expiresAt = new Date(response.data.Expires).getTime();
      // Refresh the token 1 minute before it expires
      tokenExpiry = expiresAt - 60000;
    } catch (error) {
      console.error(
        "Error obtaining access token:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  }
  return accessToken;
}

module.exports = async (req, res) => {
  try {
    const token = await getAccessToken();

    // Map query parameters to those expected by the API
    const queryParams = {
      Keywords: req.query.title || "",
      Location: req.query.location || "",
      Radius: req.query.radius || 40,
      Country: req.query.country || "US",
      Age: req.query.age || 365,
      Page: req.query.page || 1,
      PageSize: req.query.pagesize || 12,
    };

    const apiUrl = "https://api.jobs.com/search"; // Update to the correct endpoint

    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      params: queryParams,
    });

    // Set CORS headers
    res.setHeader(
      "Access-Control-Allow-Origin",
      "https://momup-client-first.webflow.io"
    );
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    res.status(200).json(response.data);
  } catch (error) {
    if (error.response) {
      console.error("Error fetching jobs:", {
        status: error.response.status,
        data: error.response.data,
      });
      res.status(error.response.status).json({ error: error.response.data });
    } else {
      console.error("Error fetching jobs:", error.message);
      res.status(500).json({ error: error.message });
    }
  }
};
