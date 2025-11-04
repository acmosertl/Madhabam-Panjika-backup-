import {
  Astronomy as A,
  MakeTime,
  EclipticLongitude,
  SearchRiseSet,
  Body
} from "astronomy-engine";

const DEG_PER_TITHI = 12;                // 360 / 30
const DEG_PER_NAK = 13 + 20/60;          // 13°20′
const NAK_NAMES = [
  "অশ্বিনী","ভরণী","কৃত্তিকা","রোহিণী","মৃগশিরা","আর্দ্রা","পুনর্বসু","পুষ্যা",
  "অশ্লেষা","মাঘা"," পূর্বফাল্গুনী"," উত্তরফাল্গুনী"," হস্তা"," চিত্রা"," স্বাতী",
  " বিশাখা"," অনুরাধা"," জ্যেষ্ঠা"," মূলা"," পূর্বাষাঢ়া"," উত্তরাষাঢ়া"," শ্রবণা",
  " ধনিষ্ঠা"," শতভিষা"," পূর্বভাদ্রপদ"," উত্তরভাদ্রপদ"," রেবতী"
];
const TITHI_NAMES = [
  "প্রতিপদ","দ্বিতীয়া","তৃতীয়া","চতুর্থী","পঞ্চমী","ষষ্ঠী","সপ্তমী","অষ্টমী",
  "নবমী","দশমী","একাদশী","দ্বাদশী","ত্রয়োদশী","চতুর্দশী","পৌূর্ণিমা",
  "প্রতিপদ (কৃষ্ণ)","দ্বিতীয়া","তৃতীয়া","চতুর্থী","পঞ্চমী","ষষ্ঠী","সপ্তমী","অষ্টমী",
  "নবমী","দশমী","একাদশী","দ্বাদশী","ত্রয়োদশী","চতুর্দশী","অমাবস্যা"
];

function bnNum(n) {
  return String(n).replace(/[0-9]/g, d => "০১২৩৪৫৬৭৮৯"[+d]);
}
function hhmm(date, locale="bn-IN") {
  // 12h Bengali
  return new Intl.DateTimeFormat("bn-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true
  }).format(date);
}
function yyyymmdd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,"0");
  const d = String(date.getDate()).padStart(2,"0");
  return `${d}-${m}-${y}`;
}

function norm360(x){ x%=360; return (x<0)? x+360: x; }

function sunMoonLongitudes(date, mode) {
  // mode kept for future (drik/surya). Drik used now (true positions)
  const t = MakeTime(date);
  const moonLon = EclipticLongitude(Body.Moon, t);
  const sunLon  = EclipticLongitude(Body.Sun,  t);
  return { moonLon: norm360(moonLon), sunLon: norm360(sunLon) };
}

function tithiInfo(date, mode) {
  const { moonLon, sunLon } = sunMoonLongitudes(date, mode);
  const diff = norm360(moonLon - sunLon);
  const tithiIndex = Math.floor(diff / DEG_PER_TITHI);             // 0..29
  const name = TITHI_NAMES[tithiIndex];

  // find end time when diff hits next multiple of 12°
  const target = (Math.floor(diff/DEG_PER_TITHI) + 1) * DEG_PER_TITHI;
  const end = searchAngle(date, mode, target);
  const nextName = TITHI_NAMES[(tithiIndex+1)%30];

  return { index: tithiIndex+1, name, end, nextName };
}

function nakshatraInfo(date, mode) {
  const { moonLon } = sunMoonLongitudes(date, mode);
  const idx = Math.floor(moonLon / DEG_PER_NAK);     // 0..26
  const name = NAK_NAMES[idx];

  const nextEdge = (Math.floor(moonLon/DEG_PER_NAK)+1)*DEG_PER_NAK;
  const end = searchMoonLon(date, mode, nextEdge);
  const nextName = NAK_NAMES[(idx+1)%27];
  return { index: idx+1, name, end, nextName };
}

function searchAngle(date, mode, targetDeg) {
  // binary search within 36 hours
  const t0 = new Date(date);
  let lo = new Date(t0), hi = new Date(t0.getTime()+36*3600e3);
  for(let i=0;i<32;i++){
    const mid = new Date((lo.getTime()+hi.getTime())/2);
    const { moonLon, sunLon } = sunMoonLongitudes(mid, mode);
    const d = norm360(moonLon - sunLon);
    if (d < targetDeg) lo = mid; else hi = mid;
  }
  return hi;
}

function searchMoonLon(date, mode, targetLon) {
  const t0 = new Date(date);
  let lo = new Date(t0), hi = new Date(t0.getTime()+36*3600e3);
  for(let i=0;i<32;i++){
    const mid = new Date((lo.getTime()+hi.getTime())/2);
    const { moonLon } = sunMoonLongitudes(mid, mode);
    if (moonLon < targetLon) lo = mid; else hi = mid;
  }
  return hi;
}

function pakshaFromTithiIndex(idx1to30){
  return (idx1to30<=15) ? "শুক্ল পক্ষ" : "কৃষ্ণ পক্ষ";
}

async function sunMoonRiseSet({ latitude, longitude, date }) {
  // rise/set around given date
  const tzMinutes = -new Date().getTimezoneOffset();
  const tA = MakeTime(date);

  const sr  = SearchRiseSet(Body.Sun,  latitude, longitude, +1, tA, 1);
  const ss  = SearchRiseSet(Body.Sun,  latitude, longitude, -1, tA, 1);
  const mr  = SearchRiseSet(Body.Moon, latitude, longitude, +1, tA, 1);
  const ms  = SearchRiseSet(Body.Moon, latitude, longitude, -1, tA, 1);

  const toDate = t => t ? t.date : null;

  return {
    sunrise: toDate(sr),
    sunset:  toDate(ss),
    moonrise:toDate(mr),
    moonset: toDate(ms)
  };
}

function nextEkadashi({ date, mode, latitude, longitude }) {
  // Find next sunrise day where tithi at sunrise is 11 or 26
  for (let d=0; d<35; d++){
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()+d, 6, 0, 0);
    const { sunrise } = { sunrise: new Date(day) }; // sunrise handled separately if needed
    const info = tithiInfo(sunrise, mode);

    if (info.index===11 || info.index===26) {
      const when = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const daysLeft = Math.ceil((when - new Date(date.setHours(0,0,0,0))) / 86400000);
      // Parana: when tithi becomes 12/27 OR next day sunrise, whichever later
      const paranaStart = info.end; // 12/27 শুরু
      return {
        date: when,
        days_left: daysLeft,
        name: ekadashiName(when, info.index),   // simple mapping
        parana_start: paranaStart
      };
    }
  }
  return null;
}

// Very lightweight ekadashi name mapper (Vaishnava common set)
function ekadashiName(gDate, tithiIndex){
  // tithiIndex 11 = শুক্ল একাদশী, 26 = কৃষ্ণ একাদশী
  // lunar month approx by Sun's ecliptic longitude
  const monthNames = ["চৈত্র","বৈশাখ","জ্যৈষ্ঠ","আষাঢ়","শ্রাবণ","ভাদ্র","আশ্বিন","কার্তিক","অগ্রহায়ণ","পৌষ","মাঘ","ফাল্গুন"];
  const sunLon = EclipticLongitude(Body.Sun, MakeTime(gDate));
  const solarMonth = Math.floor(norm360(sunLon+30)/30)%12;  // rough mapping
  const m = monthNames[solarMonth];

  const map = {
    // শুদ্ধ/গৌড়ীয় নামগুলোর সাধারণ ম্যাপিং
    "কার্তিক-11": "প্রবোধিনী (রমা) একাদশী",
    "কার্তিক-26": "রাম একাদশী",
    "আশ্বিন-11": "পাপাঙ্কুশা একাদশী",
    "আশ্বিন-26": "ইন্দিরা একাদশী",
    "মাঘ-11": "জয়া একাদশী",
    "মাঘ-26": "ষটতিলা একাদশী",
    "ফাল্গুন-11": "আমলকী একাদশী",
    "ফাল্গুন-26": "বিজয়া একাদশী",
    "আষাঢ়-11": "শয়নী একাদশী",
    "আষাঢ়-26": "যোগিনী একাদশী"
  };
  return map[`${m}-${tithiIndex}`] || "একাদশী";
}

export async function computePanchika({ latitude, longitude, tz="Asia/Kolkata", mode="drik" }) {
  const now = new Date();
  const { sunrise, sunset, moonrise, moonset } = await sunMoonRiseSet({ latitude, longitude, date: now });

  const tithi = tithiInfo(now, mode);
  const nak   = nakshatraInfo(now, mode);
  const paksha = pakshaFromTithiIndex(tithi.index);

  const ek = nextEkadashi({ date: now, mode, latitude, longitude });

  return {
    tz,
    location: { lat: latitude, lon: longitude },
    tithi: {
      name: tithi.name,
      ends_at: tithi.end ? hhmm(new Date(tithi.end)) : null,
      next: tithi.nextName
    },
    paksha,
    nakshatra: {
      name: nak.name,
      ends_at: nak.end ? hhmm(new Date(nak.end)) : null,
      next: nak.nextName
    },
    sun: {
      sunrise: sunrise ? hhmm(new Date(sunrise)) : null,
      sunset:  sunset  ? hhmm(new Date(sunset))  : null
    },
    moon: {
      moonrise: moonrise ? hhmm(new Date(moonrise)) : null,
      moonset:  moonset  ? hhmm(new Date(moonset))  : null
    },
    ekadashi: ek ? {
      name: ek.name,
      date: yyyymmdd(ek.date),
      days_left: ek.days_left,
      parana_start: ek.parana_start ? hhmm(new Date(ek.parana_start)) : null
    } : null,
    updated: new Date().toISOString()
  };
}

// ==========================================================
// ✅ EXPORT PANCHIKA ENGINE FUNCTION
// ==========================================================

export async function getPanchikaData({ latitude, longitude, tz = "Asia/Kolkata", mode = "drik" }) {
  const now = new Date();

  // সূর্য চন্দ্রোদয় সেট হিসাব করো
  const sunmoon = await sunMoonRiseSet({ latitude, longitude, date: now });

  // তিথি, নক্ষত্র ও পক্ষ বের করো
  const tithi = tithiInfo(now, mode);
  const nak = nakshatraInfo(now, mode);
  const paksha = pakshaFromTithiIndex(tithi.index);

  // পরবর্তী একাদশী বের করো
  const ekadashi = nextEkadashi(now, mode, latitude, longitude);

  // Bengali-friendly JSON রিটার্ন করো
  return {
    date: new Intl.DateTimeFormat("bn-IN", { dateStyle: "full" }).format(now),
    tithi: {
      name: tithi.name,
      ends_at: hhmm(tithi.end),
      next: tithi.nextName,
    },
    nakshatra: {
      name: nak.name,
      ends_at: hhmm(nak.end),
      next: nak.nextName,
    },
    paksha,
    sun: {
      sunrise: hhmm(sunmoon.sunrise),
      sunset: hhmm(sunmoon.sunset),
    },
    moon: {
      moonrise: hhmm(sunmoon.moonrise),
      moonset: hhmm(sunmoon.moonset),
    },
    ekadashi: ekadashi
      ? {
          name: ekadashi.name,
          date: yyyyymmdd(ekadashi.date),
          days_left: ekadashi.days_left,
        }
      : null,
  };
}

// ==========================================================
// ✅ EXPORT PANCHIKA ENGINE FUNCTION (SAFE ESM EXPORT)
// ==========================================================
async function computePanchika({ latitude, longitude, tz = "Asia/Kolkata", mode = "drik" }) {
  const now = new Date();

  const sunmoon = await sunMoonRiseSet({ latitude, longitude, date: now });
  const tithi = tithiInfo(now, mode);
  const nak = nakshatraInfo(now, mode);
  const paksha = pakshaFromTithiIndex(tithi.index);
  const ekadashi = nextEkadashi(now, mode, latitude, longitude);

  return {
    date: new Intl.DateTimeFormat("bn-IN", { dateStyle: "full" }).format(now),
    tithi: {
      name: tithi.name,
      ends_at: hhmm(tithi.end),
      next: tithi.nextName,
    },
    nakshatra: {
      name: nak.name,
      ends_at: hhmm(nak.end),
      next: nak.nextName,
    },
    paksha,
    sun: {
      sunrise: hhmm(sunmoon.sunrise),
      sunset: hhmm(sunmoon.sunset),
    },
    moon: {
      moonrise: hhmm(sunmoon.moonrise),
      moonset: hhmm(sunmoon.moonset),
    },
    ekadashi: ekadashi
      ? {
          name: ekadashi.name,
          date: yyyyymmdd(ekadashi.date),
          days_left: ekadashi.days_left,
        }
      : null,
  };
}

// ✅ Safe Export for Node + Vercel (Pure ESM)
export default computePanchika;
