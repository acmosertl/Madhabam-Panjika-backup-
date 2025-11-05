// 🕉️ ISKCON Verified Ekadashi Layer (Live API)
export async function getEkadashi() {
  try {
    const res = await fetch("https://vediccalendar-api.vercel.app/api/ekadashi?tz=Asia/Kolkata");
    const data = await res.json();

    if (!data || !data.next) {
      throw new Error("Ekadashi data unavailable");
    }

    const next = data.next;
    const now = new Date();
    const diff = Math.ceil((new Date(next.date) - now) / (1000 * 60 * 60 * 24));

    return {
      name: next.name_bn || next.name || "—",
      date: next.date,
      days_left: diff,
      paran_start: next.paran_start || "—",
      paran_end: next.paran_end || "—"
    };
  } catch (err) {
    console.error("Ekadashi Layer Error:", err);
    return { name: "—", date: "—", days_left: "-", paran_start: "-", paran_end: "-" };
  }
}
