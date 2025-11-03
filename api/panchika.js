// /api/panchika.js — Madhabam Panchika Engine v1 (Stable)
export default async function handler(req, res) {
  const lat = req.query.lat || 22.5726;
  const lon = req.query.lon || 88.3639;
  const tz = "auto";

  try {
    // ☀️ Sunrise/Sunset + Moonrise/Moonset
    const astroURL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=sunrise,sunset,moonrise,moonset&timezone=${tz}`;
    const astro = await fetch(astroURL).then(r => r.json());
    const i = 0;

    const sunrise = astro?.daily?.sunrise?.[i] || "06:00";
    const sunset = astro?.daily?.sunset?.[i] || "17:00";
    const moonrise = astro?.daily?.moonrise?.[i] || "14:00";
    const moonset = astro?.daily?.moonset?.[i] || "02:00";

    // 🪔 Panchang Data (Bengali)
    const panchangURL = `https://api.drikpanchang.com/v2/panchang?date=today&lat=${lat}&lon=${lon}&tz=${tz}`;
    const panchang = await fetch(panchangURL).then(r => r.json()).catch(() => ({}));
    const tithi = panchang?.tithi?.name_bn || "—";
    const nakshatra = panchang?.nakshatra?.name_bn || "—";

    // 🌊 Tide Data (Garden Reach reference)
    const tideURL = `https://api.open-meteo.com/v1/marine?latitude=22.5411&longitude=88.3378&daily=wave_height_max&timezone=${tz}`;
    const tideData = await fetch(tideURL).then(r => r.json()).catch(() => ({}));
    const tide = tideData?.daily?.wave_height_max
      ? tideData.daily.wave_height_max.slice(0, 4).map((v, idx) => ({
          label: ["উচ্চ জোয়ার", "নিম্ন ভাটা", "উচ্চ জোয়ার", "নিম্ন ভাটা"][idx],
          time: new Date().toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" }),
          height: v.toFixed(1)
        }))
      : [];

    // 🌼 Ekadashi Data (Fallback ISKCON)
    const ekadashi = await fetch("https://iskconapi.vercel.app/next-ekadashi")
      .then(r => r.json())
      .catch(() => ({ name: "রমা একাদশী", date: "2025-11-15", days_left: 12 }));

    res.status(200).json({
      tithi,
      nakshatra,
      sunrise,
      sunset,
      moonrise,
      moonset,
      tide,
      ekadashi,
      updated: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Engine error", message: err.message });
  }
}
