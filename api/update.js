// /api/update.js — Auto-refresh Engine vFinal-A
export default async function handler(req,res){
  try{
    const lat=22.5726, lon=88.3639;
    const urlAstro=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=sunrise,sunset,moonrise,moonset&timezone=auto`;
    const a=await fetch(urlAstro).then(r=>r.json());
    const fmt=t=>to12h(t);
    const sunrise=fmt(a.daily.sunrise[0]);
    const sunset=fmt(a.daily.sunset[0]);
    const moonrise=fmt(a.daily.moonrise[0]);
    const moonset=fmt(a.daily.moonset[0]);
    const ekadashi={name:"রমা একাদশী",date:"2025-11-15",days_left:daysLeft("2025-11-15")};
    const out={
      tithi:"—",nakshatra:"—",sunrise,sunset,moonrise,moonset,
      tide:[
        {"label":"উচ্চ জোয়ার","time":"05:45 AM"},
        {"label":"উচ্চ জোয়ার","time":"06:12 PM"},
        {"label":"নিম্ন ভাটা","time":"12:01 PM"},
        {"label":"নিম্ন ভাটা","time":"11:30 PM"}
      ],
      ekadashi,
      events:[{"name":"গীতা জয়ন্তী","date":"2025-12-05","days_left":daysLeft("2025-12-05")}],
      updated:new Date().toISOString()
    };
    // save updated json file inside /data
    await fs.writeFileSync('./data/panchika.json',JSON.stringify(out,null,2));
    res.status(200).json({ok:true,updated:out.updated});
  }catch(e){res.status(500).json({error:e.message});}
}

import fs from 'fs';
function to12h(iso){if(!iso)return iso;let s=iso.split('T')[1];let[h,m]=s.split(':');h=+h;const ampm=h>=12?"PM":"AM";h=h%12||12;return`${h}:${m} ${ampm}`;}
function daysLeft(d){const now=new Date(),t=new Date(d+"T00:00:00");return Math.max(0,Math.ceil((t-now)/(1000*60*60*24)));}
