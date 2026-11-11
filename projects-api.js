const GITHUB_API = 'https://api.github.com';
const KNOWN_INTENTS = ['Academic', 'Professional', 'Personal', 'Experimental', 'Teaching & Narrative'];

function githubHeaders() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'portfolio-projects-gallery',
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return headers;
}

async function githubJson(url) {
  const response = await fetch(url, { headers: githubHeaders() });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    const error = new Error(`GitHub API returned ${response.status}: ${detail.message || response.statusText}`);
    error.status = response.status === 404 ? 404 : 502;
    throw error;
  }
  return response.json();
}

function topicValue(topics, key) {
  const topic = topics.find((value) => value.startsWith(`${key}-`) || value.startsWith(`${key}:`));
  return topic ? topic.slice(key.length + 1).replaceAll('-', ' ').replaceAll(' and ', ' & ') : '';
}

function safeWebUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch {
    return '';
  }
}

function projectFromRepo(repo, mapping = {}) {
  const topics = Array.isArray(repo.topics) ? repo.topics : [];
  const topicIntent = topicValue(topics, 'intent');
  const configuredIntent = KNOWN_INTENTS.find((intent) => intent.toLowerCase() === String(mapping.intent || '').toLowerCase());
  const topicMatchedIntent = KNOWN_INTENTS.find((intent) => intent.toLowerCase() === topicIntent.toLowerCase());
  const subCategory = mapping.subCategory || topicValue(topics, 'category') || 'Uncategorized';
  const techTopics = topics.filter((topic) => !topic.startsWith('intent-') && !topic.startsWith('intent:') && !topic.startsWith('category-') && !topic.startsWith('category:'));

  return {
    id: repo.id,
    name: repo.name,
    title: mapping.title || repo.name,
    description: mapping.description || repo.description || 'No repository description provided.',
    intent: configuredIntent || topicMatchedIntent || 'Uncategorized',
    subCategory: subCategory.replace(/\b\w/g, (char) => char.toUpperCase()),
    deployedUrl: safeWebUrl(mapping.deployedUrl || repo.homepage || ''),
    githubUrl: safeWebUrl(repo.html_url),
    language: repo.language || '',
    stars: repo.stargazers_count || 0,
    updatedAt: repo.updated_at,
    isFork: Boolean(repo.fork),
    techTags: [...new Set([...(Array.isArray(mapping.techTags) ? mapping.techTags : []), ...(repo.language ? [repo.language] : []), ...techTopics])],
  };
}

function createProjectsHandler(loadConfig) {
  return async (req, res) => {
    try {
      const config = loadConfig();
      const username = String(req.query.username || process.env.GITHUB_USERNAME || config.github?.username || '').trim();
      if (!username || username === 'YOUR_GITHUB_USERNAME') {
        return res.status(400).json({ error: 'Set github.username in github-projects-config.json or GITHUB_USERNAME.' });
      }
      if (!/^[a-zA-Z0-9-]{1,39}$/.test(username)) {
        return res.status(400).json({ error: 'GitHub username contains invalid characters.' });
      }

      const mappings = new Map((config.github?.repos || []).map((item) => [String(item.repoName || '').toLowerCase(), item]));
      const repositories = [];
      for (let page = 1; page <= 10; page += 1) {
        const batch = await githubJson(`${GITHUB_API}/users/${encodeURIComponent(username)}/repos?type=owner&sort=updated&per_page=100&page=${page}`);
        repositories.push(...batch);
        if (batch.length < 100) break;
      }

      const projects = repositories
        .filter((repo) => !repo.private)
        .map((repo) => projectFromRepo(repo, mappings.get(repo.name.toLowerCase())))
        .sort((a, b) => (mappings.has(b.name.toLowerCase()) - mappings.has(a.name.toLowerCase())) || new Date(b.updatedAt) - new Date(a.updatedAt));

      res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      return res.json({ username, projects });
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message || 'Unable to load GitHub projects.' });
    }
  };
}

module.exports = { createProjectsHandler };