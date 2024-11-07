// api/monster-search.js

const axios = require("axios");

module.exports = async (req, res) => {
  const { q, location, page = 1, pagesize = 10 } = req.query;

  // Validate input
  if (!q || !location) {
    return res
      .status(400)
      .json({ error: "Missing query or location parameter" });
  }

  // Get the CLIENT_ID and CLIENT_SECRET from environment variables
  const CLIENT_ID = process.env.CLIENT_ID;
  const CLIENT_SECRET = process.env.CLIENT_SECRET;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    // Obtain the token
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

    // Make the search request
    const searchResponse = await axios.get(
      `https://api.jobs.com/v3/search/jobs`,
      {
        params: {
          q,
          where: location,
          page,
          pagesize,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    res.status(200).json(searchResponse.data);
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
