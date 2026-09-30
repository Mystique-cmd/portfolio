# Mystique Portfolio

Static portfolio served by a small Express application. The projects panel loads public repositories from GitHub and applies the curated intent/category mappings below.

## Run locally

1. Use Node.js 18 or newer.
2. Set `github.username` in `github-projects-config.json` to the GitHub account to display. Alternatively, set `GITHUB_USERNAME` in the environment.
3. Install dependencies with `npm install`, then start with `npm start`.
4. Open `http://localhost:3000`. Do not open `index.html` directly: the GitHub API proxy is served by the app.

Public repositories work without a token. For higher GitHub API rate limits, set `GITHUB_TOKEN` in the server environment; never put the token in browser code or commit it.

## Categorize repositories

Add entries to `github-projects-config.json` under `github.repos` to curate a repository. Each entry uses `repoName` plus optional `intent`, `subCategory`, `title`, `description`, `deployedUrl`, and `techTags`. For example:

```json
{
  "repoName": "my-repository",
  "intent": "Academic",
  "subCategory": "Algorithms",
  "deployedUrl": "https://demo.example.org",
  "techTags": ["Algorithms", "Research"]
}
```

Mappings override automatic classification and are matched by repository name, case-insensitively. Without a mapping, a repository can set GitHub topics `intent-academic` and `category-algorithms`; topic values become its displayed intent/category. Any unclassified repositories appear under `Uncategorized` so they remain discoverable.

Supported intent navigation: `Academic`, `Professional`, `Personal`, `Experimental`, and `Teaching & Narrative`. Category labels are drawn from the repositories assigned to the selected intent, so custom categories work without code changes.

`GET /api/projects` returns public repositories, sorted with curated mappings first and then by most recently updated. `GET /api/health` can be used for a quick server check.