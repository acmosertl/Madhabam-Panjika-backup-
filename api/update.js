import { generatePanchika } from '../lib/panchika-engine.js';
import { getEkadashi } from '../lib/ekadashi-layer.js';
import { getTide } from '../lib/tide-engine.js';
import { verifySources } from '../lib/verify-sources.js';

export default async function handler(req, res) {
  try {
    const panchika = await generatePanchika();
    const ekadashi = await getEkadashi();
    const tide = await getTide();

    const verified = await verifySources({ ...panchika, ekadashi, tide });
    res.status(200).json({ ok: true, updated: new Date().toISOString(), data: verified });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
