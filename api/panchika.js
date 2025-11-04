// Mādhabam Panchika vC3 — Panchika Engine (Live)
// Kolkata-locked | 12-hour Bengali time | Dynamic Tithi/Nakshatra placeholders

export default async function handler(req, res) {
  const lat = 22.5411;
  const lon = 88.3136;
  const tz = "Asia/Kolkata";

  const toBN = (num) =>
    num.toString().replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);

  const to12hBN = (time) => {
    if (!time) return "—";
    let [h, m] = time.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    h = ((h + 11) % 12) + 1;
    return `${toBN(h)}:${toBN(m.toString().padStart(2, "0"))} ${ampm}`;
  };

  try {
    // Fetch sunrise/sunset/moon data
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=sunrise,sunset,moonrise,moonset&timezone=${tz}`;
    const r = await fetch(url);
    const j = await r.json();

    const sr = j.daily.sunrise[0].split("T")[1].substring(0, 5);
    const ss = j.daily.sunset[0].split("T")[1].substring(0, 5);
    const mr = j.daily.moonrise[0].split("T")[1].substring(0, 5);
    const ms = j.daily.moonset[0].split("T")[1].substring(0, 5);

    // Static demo data (will later pull from DrikPanchang API)
    const data = {
      tithi: { current: "একাদশী", ends_at: "১১:৪৫ PM", next: "দ্বাদশী" },
      paksha: "কৃষ্ণ পক্ষ",
      nakshatra: { current: "অশ্বিনী", ends_at: "০৮:৩০ AM", next: "ভরণী" },
      sunrise: to12hBN(sr),
      sunset: to12hBN(ss),
      moonrise: to12hBN(mr),
      moonset: to12hBN(ms),
      ekadashi: {
        name: "রমা একাদশী",
        date: "15-11-2025",
        days_left: 11,
      },
      festival: {
        name: "গীতা জয়ন্তী",
        date: "05-12-2025",
        days_left: 31,
      },
      tide: [
        { label: "উচ্চ জোয়ার ১", time: "০৬:১২ AM" },
        { label: "উচ্চ জোয়ার ২", time: "০৬:৩৭ PM" },
        { label: "নিম্ন ভাটা ১", time: "১২:২০ PM" },
        { label: "নিম্ন ভাটা ২", time: "১২:৪৮ AM" },
      ],
      updated: new Date().toISOString(),
    };

    res.setHeader("Cache-Control", "s-maxage=10800, stale-while-revalidate=5400");
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Panchika Engine Error", message: err.message });
  }
}
