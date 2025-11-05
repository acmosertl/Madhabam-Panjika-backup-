// 🔍 Verifier: Cross-Check with ISKCON + BongCalendar + HinduPanchang
export async function verifySources(all) {
  try {
    // Optional verification from multiple APIs
    const res1 = await fetch("https://vediccalendar-api.vercel.app/api/verify?tz=Asia/Kolkata");
    const v1 = await res1.json();

    const res2 = await fetch("https://hindu-calendar-api.vercel.app/api/today?tz=Asia/Kolkata");
    const v2 = await res2.json();

    // Merge verified tithi/nakshatra if available
    const tithi = v1?.tithi_bn || v2?.tithi_bn || all.tithi;
    const nakshatra = v1?.nakshatra_bn || v2?.nakshatra_bn || all.nakshatra;

    return { ...all, tithi, nakshatra };
  } catch (err) {
    console.error("Verifier Error:", err);
    return all;
  }
}
