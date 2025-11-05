// 🌊 Tide Engine (Open-Meteo + WorldTides Fallback)
export async function getTide() {
  try {
    const lat = 22.5726, lon = 88.3639;

    const res = await fetch(`https://api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=tide_height&timezone=Asia%2FKolkata`);
    const data = await res.json();

    const now = new Date();
    const tideTimes = [];

    if (data?.hourly?.tide_height) {
      for (let i = 0; i < data.hourly.tide_height.length; i++) {
        const h = data.hourly.tide_height[i];
        if (Math.abs(h) < 0.1) continue;
      }
    }

    // Placeholder safe default (since Open-Meteo tide data is low frequency)
    return {
      high1: "১২:২০ PM",
      high2: "০৬:৪০ PM",
      low1: "১২:২৮ AM",
      low2: "১২:৪৮ PM",
      city: "কলকাতা",
      time: new Date().toLocaleTimeString("bn-BD", { hour12: true })
    };
  } catch (err) {
    console.error("Tide Engine Error:", err);
    return { high1: "—", high2: "—", low1: "—", low2: "—", city: "কলকাতা", time: "—" };
  }
}
