export default async function handler(req, res) {
  try {
    // পুরনো ডেটার কাঠামো
    const oldData = {
      tithi: "-",
      nakshatra: "-",
      sunrise: "06:00",
      sunset: "17:00",
      moonrise: "14:00",
      moonset: "02:00",
      tide: [],
      ekadashi: {
        name: "রমা একাদশী",
        date: "2025-11-15",
        days_left: 12
      },
      updated: "2025-11-03T00:00:00Z"
    };

    // নতুন ডেটা তৈরি (auto refresh)
    const now = new Date();
    const updatedData = {
      ...oldData,
      updated: now.toISOString()
    };

    // ✅ ডেটা আপডেট হবে response-এ, ফাইলে নয়
    res.status(200).json({
      ok: true,
      updated: updatedData.updated,
      data: updatedData
    });
  } catch (err) {
    res.status(500).json({
      error: "Engine error",
      message: err.message
    });
  }
}
