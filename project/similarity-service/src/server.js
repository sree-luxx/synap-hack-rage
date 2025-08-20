const express = require('express');
const { exec: execCb } = require('child_process');
const { mkdtemp, rm } = require('fs/promises');
const { tmpdir } = require('os');
const { join } = require('path');
const util = require('util');
const exec = util.promisify(execCb);

const PORT = process.env.PORT || 3001;
const API_KEY = process.env.SIMILARITY_API_KEY || '';

const app = express();
app.use(express.json({ limit: '1mb' }));

function auth(req, res, next) {
  if (!API_KEY) return next();
  const authz = req.headers['authorization'] || '';
  if (!authz.startsWith('Bearer ') || authz.slice(7) !== API_KEY) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}

async function cloneRepo(url, dir) {
  await exec(`git clone --depth 1 ${url} ${dir}`);
}

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/compare', auth, async (req, res) => {
  const { repoA, repoB } = req.body || {};
  if (!repoA || !repoB) return res.status(400).json({ message: 'Missing repoA/repoB' });
  const root = await mkdtemp(join(tmpdir(), 'sim-'));
  const dirA = join(root, 'a');
  const dirB = join(root, 'b');
  try {
    await cloneRepo(repoA, dirA);
    await cloneRepo(repoB, dirB);
    // Use jscpd to compare both directories. We output JSON and parse percentage duplicated.
    const { stdout } = await exec(`npx --yes jscpd ${dirA} ${dirB} --silent --reporters json | cat`);
    let json = {};
    try { json = JSON.parse(stdout || '{}'); } catch {}
    const percent = Number(json?.statistics?.total?.percentage || 0);
    const score = Math.max(0, Math.min(1, percent / 100));
    res.json({ score, details: json });
  } catch (e) {
    res.status(500).json({ message: e?.message || 'failed' });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Similarity service listening on :${PORT}`);
});


