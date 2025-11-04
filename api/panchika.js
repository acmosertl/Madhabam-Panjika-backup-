// Mādhabam Panchika vC4 — Single-Shot Build
// Kolkata-locked; Sun/Moon live (Open-Meteo); Tide fixed slots; Panchika fields structured (Approx mode)

export default async function handler(req, res) {
  const lat = 22.5411, lon = 88.3136; // Garden Reach (Kolkata)
  const tz = "Asia/Kolkata";

  const toBN = s => String(s).replace(/[0-9]/g, d => "০১২৩৪৫৬৭৮৯"[d]);
  const to12hBN = hhmm => {
    if (!hhmm) return "—";
    let [h, m] = hhmm.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    h = ((h + 11) % 12) + 1;
    return `${toBN(h)}:${toBN(String(m).padStart(2,"0"))} ${ampm}`;
  };

  // Defaults (fallback so the UI never goes blank)
  let sr="06:00", ss="17:00", mr="14:00", ms="02:00";

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=sunrise,sunset,moonrise,moonset&timezone=${encodeURIComponent(tz)}`;
    const r = await fetch(url);
    const j = await r.json();
    if (j?.daily) {
      const chop = s => s?.split("T")[1]?.slice(0,5);
      sr = chop(j.daily.sunrise?.[0]) || sr;
      ss = chop(j.daily.sunset?.[0])  || ss;
      mr = chop(j.daily.moonrise?.[0])|| mr;
      ms = chop(j.daily.moonset?.[0]) || ms;
    }
  } catch (_) { /* fallback remains */ }

  // Static demo ekadashi & festival (UI-ready)
  const ekDate = "2025-11-15";
  const daysLeft = Math.max(0, Math.ceil((new Date(`${ekDate}T00:00:00+05:30`) - new Date())/(1000*60*60*24)));

  const out = {
    mode: "approx", // Panchika core not yet Drik/Surya-synced (placeholder names below so UI stays filled)
    tithi: { name_bn: "ত্রয়োদশী", ends_at: "১১:৪৫ PM", next_bn: "চতুর্দশী" },
    paksha: "কৃষ্ণ পক্ষ",
    nakshatra: { name_bn: "অশ্বিনী", ends_at: "০৮:৩০ AM", next_bn: "ভরণী" },

    sunrise: to12hBN(sr),
    sunset:  to12hBN(ss),
    moonrise:to12hBN(mr),
    moonset: to12hBN(ms),

    ekadashi: {
      name_bn: "রমা একাদশী",
      date: "15-11-2025",
      days_left: daysLeft,
      parana_note: "পারণ: একাদশী শেষে দ্বাদশীতে শাস্ত্রোক্ত সময়ে"
    },

    upcoming: {
      title: "গীতা জয়ন্তী",
      date: "05-12-2025",
      days_left: Math.max(0, Math.ceil((new Date("2025-12-05T00:00:00+05:30") - new Date())/(1000*60*60*24)))
    },

    tide: {
      location: "কলকাতা",
      high: ["০৬:১২ AM", "০৬:৩৭ PM"],
      low:  ["১২:২০ PM", "১২:৪৮ AM"]
    },

    updated: new Date().toISOString()
  };

  res.setHeader("Cache-Control", "s-maxage=10800, stale-while-revalidate=5400");
  return res.status(200).json(out);
}
