const fs = require('fs');
const path = require('path');
const express = require('express');
const { createProjectsHandler } = require('./projects-api');

const app = express();
const ROOT = __dirname;
const CONFIG_PATH = path.join(ROOT, 'github-projects-config.json');
const PORT = Number(process.env.PORT) || 3000;

app.disable('x-powered-by');
app.use(express.static(ROOT, { extensions: ['html'] }));

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch (error) {
    throw new Error(`Could not read github-projects-config.json: ${error.message}`);
  }
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/projects', createProjectsHandler(loadConfig));

app.listen(PORT, () => console.log(`Portfolio running at http://localhost:${PORT}`));

