// api/panchika.js
import { computePanchika } from "../lib/panchika-core.js";

export default async function handler(req, res) {
  try {
    const { lat, lon, mode = "drik", tz = "Asia/Kolkata" } = req.query || {};
    const latitude = isFinite(lat) ? +lat : 22.5411;
    const longitude = isFinite(lon) ? +lon : 88.3378;

    const data = await computePanchika({ latitude, longitude, tz, mode });
    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      error: "Panchika Engine Error",
      message: String(err?.message || err),
    });
  }
}
