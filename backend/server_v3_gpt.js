// backend/server_v3.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { Octokit } = require("@octokit/rest");

const app = express();
const PORT = process.env.PORT || 3000;

// ---- Pulse (heartbeat -> GitHub) ----
function ts() {
  const off = parseInt(process.env.TIMEZONE_OFFSET || "3", 10);
  const d = new Date(Date.now() + off * 3600 * 1000);
  return { iso: new Date().toISOString(), local: d.toISOString().replace("T"," ").slice(0,19) + ` UTC+${off}` };
}

async function upsertJSON({octokit, owner, repo, path, content, message}) {
  let sha;
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    if (!Array.isArray(data)) sha = data.sha;
  } catch (e) {
    if (e.status && e.status !== 404) throw e;
  }
  await octokit.repos.createOrUpdateFileContents({
    owner, repo, path, sha,
    message,
    content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64")
  });
}

function startPulse() {
  if (process.env.PULSE_ENABLED !== "true") {
    console.log("🔕 Pulse disabled (set PULSE_ENABLED=true)");
    return () => {};
  }
  const token  = process.env.GITHUB_TOKEN;
  const target = process.env.GITHUB_REPO_EYES || "guannko/offerspsp.com";
  const path   = process.env.PULSE_PATH || "autosaves/HEARTBEAT.json";
  const every  = parseInt(process.env.PULSE_INTERVAL_SEC || "300", 10);

  if (!token) { console.warn("⚠️ Pulse: GITHUB_TOKEN missing"); return () => {}; }

  const [owner, repo] = target.split("/");
  const octokit = new Octokit({ auth: token });

  const tick = async (reason="interval") => {
    const t = ts();
    const payload = {
      ok: true, service: "annoris-autosave", reason,
      updated_at_utc: t.iso, updated_at_local: t.local,
      timezone_offset: parseInt(process.env.TIMEZONE_OFFSET || "3", 10),
    };
    try {
      await upsertJSON({
        octokit, owner, repo, path: path,
        content: payload,
        message: `pulse: ${payload.updated_at_utc} (${reason})`
      });
      console.log(`💓 Pulse → ${owner}/${repo}/${path} @ ${payload.updated_at_local}`);
    } catch (e) {
      console.error("Pulse error:", e.message);
    }
  };

  tick("startup");
  const id = setInterval(() => tick().catch(()=>{}), every * 1000);
  return () => clearInterval(id);
}
// -------------------------------------

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'annoris-autosave',
    timestamp: new Date().toISOString(),
    pulse: process.env.PULSE_ENABLED === 'true' ? 'enabled' : 'disabled'
  });
});

app.post('/autosave', (req, res) => {
  const token = req.headers.authorization || req.body?.token;
  if (token !== process.env.AUTH_TOKEN) return res.status(401).json({ error: 'Unauthorized' });
  console.log('Autosave received:', req.body);
  res.json({ success: true });
});

app.get('/', (_req, res) => {
  res.json({ service: 'Annoris Autosave Service', version: '3.1', endpoints: ['/health','/autosave'] });
});

app.listen(PORT, () => {
  console.log(`Server v3.1 on :${PORT}`);
  startPulse();
});
