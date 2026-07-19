// Simple Express server to fetch GitHub repositories and map them into your Projects carousel.
// Usage:
//   1) Create a token with `repo` scope (or fine-grained permissions for public repos)
//   2) Set env: GITHUB_TOKEN=...
//   3) Set env: GITHUB_USERNAME=...
//   4) Add mapping in github-projects-config.json
//   5) Run: npm i express node-fetch && node server.js

const fs = require('fs');
const path = require('path');
const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.static(path.join(__dirname)));

const CONFIG_PATH = path.join(__dirname, 'github-projects-config.json');

function loadConfig() {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
  return JSON.parse(raw);
}

function githubHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function fetchRepo(token, owner, repo) {
  const url = `https://api.github.com/repos/${owner}/${repo}`;
  const res = await fetch(url, { headers: githubHeaders(token) });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error for ${owner}/${repo}: ${res.status} ${text}`);
  }
  return res.json();
}

app.get('/api/projects', async (req, res) => {
  try {
    const token = process.env.GITHUB_TOKEN;
    const username = process.env.GITHUB_USERNAME;
    if (!token) return res.status(400).json({ error: 'Missing env GITHUB_TOKEN' });
    if (!username) return res.status(400).json({ error: 'Missing env GITHUB_USERNAME' });

    const config = loadConfig();
    const repos = config?.github?.repos || [];

    const out = [];
    for (const item of repos) {
      const repoName = item.repoName;
      if (!repoName) continue;

      const repo = await fetchRepo(token, username, repoName);

      out.push({
        id: repoName,
        intent: item.intent,
        subCategory: item.subCategory,
        title: repo.name,
        description: repo.description || '',
        // Deployed URL is optional; put it into config if you have one.
        deployedUrl: item.deployedUrl || '',
        githubUrl: repo.html_url,
        techTags: item.techTags || [],
      });
    }

    res.json(out);
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

