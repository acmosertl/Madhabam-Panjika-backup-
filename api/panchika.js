// Madhabam Panjika Serverless Function (Node 20 Compatible)

const { computePanchika } = require("../lib/panchika-core.js");

module.exports = async (req, res) => {
  try {
    const query = req.query || {};
    const lat = parseFloat(query.lat) || 22.5411;
    const lon = parseFloat(query.lon) || 88.3378;
    const mode = query.mode || "drik";
    const tz = "Asia/Kolkata";

    const data = await computePanchika({
      latitude: lat,
      longitude: lon,
      tz,
      mode
    });

    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");
    res.status(200).json(data);
  } catch (error) {
    console.error("Panchika API Error:", error);
    res.status(500).json({
      error: "Panchika Engine Error",
      message: error.message || String(error)
    });
  }
};
