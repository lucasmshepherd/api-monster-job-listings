const axios = require("axios");

module.exports = async (req, res) => {
  const { q, location } = req.query;

  // CORS headers
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://momup-client-first.webflow.io"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (!q || !location) {
    return res
      .status(400)
      .json({ error: "Missing query or location parameter" });
  }

  const CLIENT_ID = process.env.CLIENT_ID;
  const CLIENT_SECRET = process.env.CLIENT_SECRET;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error("Missing CLIENT_ID or CLIENT_SECRET environment variables");
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    // Obtain the token
    const authResponse = await axios.post(
      `https://api.jobs.com/auth/token`,
      null,
      {
        params: {
          AppId: CLIENT_ID.trim(), // remove any extra spaces
          AppSecret: CLIENT_SECRET.trim(),
        },
      }
    );

    // Check if token is received
    const token = authResponse.data?.Token;
    if (!token) {
      console.error("Failed to retrieve token:", authResponse.data);
      return res
        .status(401)
        .json({ error: "Unauthorized - Invalid credentials" });
    }

    // Make the search request
    const searchResponse = await axios.get(
      `https://api.jobs.com/v3/search/jobs`,
      {
        params: {
          q,
          where: location,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    res.status(200).json(searchResponse.data);
  } catch (error) {
    console.error("Error in serverless function:", error.message || error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
