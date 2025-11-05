// lib/panchika-engine.js
import { jdUTC, sunLon, moonLon, toSidereal, clamp360, sunriseSunset, to12h } from "./astro-core.js";
import { computeEkadashiAndParan } from "./ekadashi-layer.js";
import { computeTides } from "./tide-engine.js";

const TITHI = ["প্রথমা","দ্বিতীয়া","তৃতীয়া","চতুর্থী","পঞ্চমী","ষষ্ঠী","সপ্তমী","অষ্টমী","নবমী","দশমী","একাদশী","দ্বাদশী","ত্রয়োদশী","চতুর্দশী","পূর্ণিমা/অমাবস্যা"];
const NAK   = ["অশ্বিনী","ভরণী","কৃত্তিকা","রোহিণী","মৃগশিরা","আর্দ্রা","পুনর্বসু","পুষ্যা","অশ্লেষা","মঘা","পূর্বফল্গুনি","উত্তরফল্গুনি","হস্তা","চিত্রা","স্বাতী","বিশাখা","অনুরাধা","জ্যেষ্ঠা","মূলা","পূর্বাষাঢ়া","উত্তরাষাঢ়া","শ্রবণ","ধনিষ্ঠা","শতভিষা","পূর্বভাদ্রপদ","উত্তরভাদ্রপদ","রেবতী"];

const TSTEP = what => what==="tithi" ? 12 : (13 + 20/60); // 12°, 13°20′

function degDiffTithi(jd){
  const d = clamp360(moonLon(jd) - sunLon(jd));
  return d;
}
function tithiIndexFromDeg(d){ return Math.floor(d/12); } // 0..29

function nakIndexFromSid(mSid){ return Math.floor(mSid/13.3333333333); } // 0..26

function nextBoundary(date, mode, what, tzHours){
  // binary search next change within 36h
  const stepDeg = TSTEP(what);
  const start = new Date(date);
  const t0 = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate(), start.getUTCHours(), start.getUTCMinutes());
  const val0 = valueAt(t0);

  function valueAt(ms){
    const dt = new Date(ms);
    const jd = jdUTC(dt.getUTCFullYear(), dt.getUTCMonth()+1, dt.getUTCDate(), dt.getUTCHours(), dt.getUTCMinutes(), 0);
    if (what==="tithi"){
      return degDiffTithi(jd);
    } else {
      const mSid = toSidereal(moonLon(jd), jd);
      return mSid;
    }
  }

  const k0 = Math.floor(val0/stepDeg);
  const target = (k0+1)*stepDeg;
  let lo=t0, hi=t0+36*3600*1000;

  for(let i=0;i<40;i++){
    const mid = (lo+hi)>>1;
    let vm = valueAt(mid);
    let v0 = val0;
    if(vm < v0) vm += 360;
    const tgt = target < v0 ? target + 360 : target;
    if (vm >= tgt) hi = mid; else lo = mid;
  }
  return new Date(hi + tzHours*3600*1000); // return local-ish
}

export function computePanchika({ date=new Date(), lat=22.5411, lon=88.3378, tz="Asia/Kolkata", mode="drik" }={}){
  // tz hours
  const tzd = new Date(date.toLocaleString("en-US",{timeZone:tz}));
  const tzHours = - tzd.getTimezoneOffset()/60;

  const jd = jdUTC(date.getUTCFullYear(), date.getUTCMonth()+1, date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), 0);

  // Tithi (Drik: tropical difference)
  const d = degDiffTithi(jd);
  const ti = tithiIndexFromDeg(d);
  const paksha = (ti<15) ? "শুক্ল পক্ষ" : "কৃষ্ণ পক্ষ";
  const tName = TITHI[ti%15];
  const tNextName = TITHI[(ti+1)%15];
  const tEndsAt = nextBoundary(date, mode, "tithi", tzHours);

  // Nakshatra (sidereal moon, Lahiri)
  const mSid = toSidereal(moonLon(jd), jd);
  const ni   = nakIndexFromSid(mSid);
  const nName = NAK[ni%27];
  const nNextName = NAK[(ni+1)%27];
  const nEndsAt = nextBoundary(date, "surya", "nakshatra", tzHours);

  // Sunrise/Sunset
  const { sunrise, sunset } = sunriseSunset(tzd, lat, lon, tzHours);
  const moonrise="—", moonset="—"; // (optional: heavy to compute; placeholder)

  // Ekadashi + Paran
  const ek = computeEkadashiAndParan({ date, lat, lon, tz, tzHours });

  // Tide
  const tide = computeTides({ date, tz });

  return {
    mode,
    // Panchika
    tithi: tName,
    tithi_next: tNextName,
    tithi_ends_at: tEndsAt ? to12h(`${String(tEndsAt.getHours()).padStart(2,"0")}:${String(tEndsAt.getMinutes()).padStart(2,"0")}`) : "—",
    paksha,
    nakshatra: nName,
    nakshatra_next: nNextName,
    nakshatra_ends_at: nEndsAt ? to12h(`${String(nEndsAt.getHours()).padStart(2,"0")}:${String(nEndsAt.getMinutes()).padStart(2,"0")}`) : "—",
    sunrise, sunset, moonrise, moonset,

    // Ekadashi + Paran (today context)
    ekadashi: ek.isEkadashiToday ? { today: true } : { today: false },
    paran: ek,         // has paran_date, paran_start, paran_end

    // Tide (approx, local)
    tide,

    updated: new Date().toISOString()
  };
}
