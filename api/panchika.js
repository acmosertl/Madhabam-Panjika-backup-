export default async function handler(req, res) {
  try {
    const lat = 22.5411;
    const lon = 88.3378;
    const tz = "Asia/Kolkata";

    // ☀️ Sunrise/sunset/moonrise/moonset
    const astroUrl = `https://api.sunrisesunset.io/json?lat=${lat}&lng=${lon}&timezone=${tz}`;
    let astro = {};
    try {
      const r = await fetch(astroUrl);
      const j = await r.json();
      astro = j.results || {};
    } catch {
      astro = { sunrise: "06:00 AM", sunset: "05:00 PM", moonrise: "02:00 PM", moonset: "02:00 AM" };
    }

    // 🔹 Panchika test data with sub-times
    const data = {
      tithi: "ত্রয়োদশী",
      tithiEnds: "১১:৪৫ PM",
      tithiNext: "চতুর্দশী",
      nakshatra: "অশ্বিনী",
      nEnd: "০৮:৩০ AM",
      nNext: "ভরণী",
      paksha: "কৃষ্ণ পক্ষ",
      sunrise: astro.sunrise,
      sunset: astro.sunset,
      moonrise: astro.moonrise,
      moonset: astro.moonset,
      ekadashi: { name: "উত্পন্না একাদশী", date: "2025-12-11", days_left: 36, parana: "দ্বাদশীতে সকাল ৭-৯ মধ্যে" },
      events: [{ name: "গীতা জয়ন্তী", date: "2025-12-05", days_left: 31 }],
      tide: [
        { high1: "12:20 PM", high2: "06:40 PM" },
        { low1: "12:28 AM", low2: "12:48 PM" }
      ],
      updated: new Date().toISOString()
    };

    res.status(200).json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ error: "Engine failed", message: err.message });
  }
}
