// /api/engine.js
export default async function handler(req, res) {
  const lat = req.query.lat || 22.5726;
  const lon = req.query.lon || 88.3639;
  const tz = "auto";

  try {
    // 🌞 1. Open-Meteo Astronomy API
    const astroURL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=sunrise,sunset,moonrise,moonset&timezone=${tz}`;
    const astro = await fetch(astroURL).then(r => r.json());
    const today = 0;

    // 🪔 2. Hindu Panchang API (free public fallback)
    const panjikaURL = `https://panchang.vercel.app/api?lat=${lat}&lon=${lon}`;
    const panjika = await fetch(panjikaURL).then(r => r.json()).catch(() => ({}));

    // 🌊 3. Tide (Kolkata ref)
    const tideURL = `https://www.worldtides.info/api/v2?heights&lat=22.5411&lon=88.3378&days=1&datum=MSL&key=demo`;
    const tide = await fetch(tideURL).then(r => r.json()).catch(() => ({}));

    // ⏱️ High/Low tide filter
    const tides = tide.heights
      ? tide.heights.slice(0, 4).map(t => ({
          time: new Date(t.dt * 1000).toLocaleTimeString("bn-BD", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          height: t.height.toFixed(2),
        }))
      : [];

    // 🌼 4. Ekadashi (ISKCON fallback)
    const ekadashiURL = "https://iskconapi.vercel.app/next-ekadashi";
    const ekadashi = await fetch(ekadashiURL).then(r => r.json()).catch(() => ({
      name: "রমা একাদশী",
      date: "2025-11-15",
      days_left: 12,
    }));

    res.status(200).json({
      tithi: panjika.tithi_bn || "—",
      nakshatra: panjika.nakshatra_bn || "—",
      sunrise: astro.daily.sunrise[today],
      sunset: astro.daily.sunset[today],
      moonrise: astro.daily.moonrise[today],
      moonset: astro.daily.moonset[today],
      tide: tides,
      ekadashi: ekadashi,
      updated: new Date().toISOString(),
    });
  } catch (e) {
    res.status(500).json({ error: "Engine error", message: e.message });
  }
}
