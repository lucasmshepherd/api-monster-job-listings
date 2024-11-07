const axios = require("axios");

module.exports = async (req, res) => {
  const { q, location } = req.query;

  // CORS headers
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://momup-client-first.webflow.io"
  ); // change to your Webflow URL
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
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    const authResponse = await axios.post(
      `https://api.jobs.com/auth/token`,
      null,
      {
        params: {
          AppId: CLIENT_ID,
          AppSecret: CLIENT_SECRET,
        },
      }
    );

    const token = authResponse.data.Token;

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
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
