// /api/panchika.js — vC1.4 Final (Kolkata-lock + Tide + Paksha + 12h Bengali)
export default async function handler(req, res) {
  const lat = 22.5411;
  const lon = 88.3136;

  const to12hBN = (time) => {
    try {
      const [h, m] = time.split(":").map(Number);
      const isPM = h >= 12;
      const hr = ((h + 11) % 12) + 1;
      const bn = (n) => "০১২৩৪৫৬৭৮৯"[n] || n;
      const formatted = `${bn(hr)}:${bn(Math.floor(m/10))}${bn(m%10)} ${isPM ? "অপরাহ্ন" : "পূর্বাহ্ন"}`;
      return formatted;
    } catch {
      return "—";
    }
  };

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=sunrise,sunset,moonrise,moonset&timezone=Asia%2FKolkata`;
    const r = await fetch(url);
    const j = await r.json();

    let sr = "06:00", ss = "17:00", mr = "14:00", ms = "02:00";
    if (j && j.daily) {
      sr = j.daily.sunrise?.[0]?.split("T")[1]?.substring(0,5) || sr;
      ss = j.daily.sunset?.[0]?.split("T")[1]?.substring(0,5) || ss;
      mr = j.daily.moonrise?.[0]?.split("T")[1]?.substring(0,5) || mr;
      ms = j.daily.moonset?.[0]?.split("T")[1]?.substring(0,5) || ms;
    }

    // Ekadashi static upcoming
    const ekDate = "2025-11-15";
    const ekadashi = {
      name: "রমা একাদশী",
      date: ekDate.split("-").reverse().join("-"),
      days_left: Math.max(
        0,
        Math.ceil(
          (new Date(`${ekDate}T00:00:00+05:30`) - new Date()) / (1000*60*60*24)
        )
      )
    };

    const data = {
      tithi: "দ্বাদশী",
      paksha: "কৃষ্ণ পক্ষ",
      nakshatra: "আশ্বিনী",
      sunrise: to12hBN(sr),
      sunset: to12hBN(ss),
      moonrise: to12hBN(mr),
      moonset: to12hBN(ms),
      tide: [
        {label:"উচ্চ জোয়ার ১", time:"০৬:১২ পূর্বাহ্ন"},
        {label:"উচ্চ জোয়ার ২", time:"০৬:৩৭ অপরাহ্ন"},
        {label:"নিম্ন ভাটা ১", time:"১২:২০ অপরাহ্ন"},
        {label:"নিম্ন ভাটা ২", time:"১২:৪৮ পূর্বাহ্ন"}
      ],
      ekadashi,
      updated: new Date().toISOString()
    };

    res.setHeader("Cache-Control","s-maxage=10800, stale-while-revalidate=5400");
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({
      error: "Panchika Engine Error",
      message: err?.message || String(err)
    });
  }
}
