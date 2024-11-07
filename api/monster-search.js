const axios = require("axios");

module.exports = async (req, res) => {
  const { q, location, page = 1, perPage = 20 } = req.query;

  // Set CORS headers for all responses, including errors
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
          AppId: CLIENT_ID.trim(),
          AppSecret: CLIENT_SECRET.trim(),
        },
        timeout: 5000, // Set a 5-second timeout for the token request
      }
    );

    const token = authResponse.data?.Token;
    if (!token) {
      console.error("Failed to retrieve token:", authResponse.data);
      return res
        .status(401)
        .json({ error: "Unauthorized - Invalid credentials" });
    }

    // Make the search request with pagination parameters
    const searchResponse = await axios.get(
      `https://api.jobs.com/v3/search/jobs`,
      {
        params: {
          q,
          where: location,
          page, // pagination page number
          perPage, // number of results per page
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 5000, // Set a 5-second timeout for the search request
      }
    );

    // Extract pagination links from the response headers
    const paginationLinks = searchResponse.headers["link"];

    res.status(200).json({
      data: searchResponse.data,
      paginationLinks,
    });
  } catch (error) {
    console.error("Error in serverless function:", error.message || error);

    // Return a CORS-compliant error response
    if (error.code === "ECONNABORTED") {
      res.status(504).json({ error: "Request timed out" });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};
