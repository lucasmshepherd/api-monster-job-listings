// api/jobs.js

const axios = require("axios");

let accessToken = null;
let tokenExpiry = null;

const clientId = process.env.CLIENT_ID; 
const clientSecret = process.env.CLIENT_SECRET;

async function getAccessToken() {
  if (!accessToken || Date.now() >= tokenExpiry) {
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("client_id", clientId);
    params.append("client_secret", clientSecret);

    const response = await axios.post(
      "https://auth.monster.com/oauth2/token",
      params
    );

    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + response.data.expires_in * 1000 - 60000; // Refresh 1 minute before expiry
  }
  return accessToken;
}

module.exports = async (req, res) => {
  try {
    const token = await getAccessToken();

    const queryParams = req.query;

    const monsterResponse = await axios.get(
      "https://api.jobs.com/v3/search/jobs",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: queryParams, // Forward query parameters from the client
      }
    );

    // Set CORS headers
    res.setHeader(
      "Access-Control-Allow-Origin",
      "https://momup.com"
    ); // Replace with your actual site
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    res.status(200).json(monsterResponse.data);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: error.message });
  }
};
