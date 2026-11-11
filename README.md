# Mystique Portfolio

Portfolio with a shared GitHub projects API: Express serves it locally, and the Vercel function in `api/projects.js` serves the same data in production. The projects panel loads public repositories and applies the curated intent/category mappings in `github-projects-config.json`.

## Run locally

1. Use Node.js 18 or newer.
2. Set `github.username` in `github-projects-config.json` to the GitHub account to display. Alternatively, set `GITHUB_USERNAME` in the environment.
3. Install dependencies with `npm install`, then start with `npm start`.
4. Open `http://localhost:3000`. Do not open `index.html` directly: the GitHub API is served by the app.

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

The configured account's current public repositories are categorized in `github-projects-config.json`; repositories with a GitHub homepage automatically show a live-demo link. New repositories are included on the next request and can be categorized by adding a mapping or GitHub topics.

## Deploy to Vercel

Import the repository into Vercel and deploy from the project root. Vercel serves `api/projects.js` at `/api/projects`; the portfolio frontend calls that same relative URL locally and in production. Set `GITHUB_USERNAME` and, optionally, `GITHUB_TOKEN` as Vercel environment variables if you want to override the checked-in username or raise GitHub API rate limits. Redeploy after editing project mappings so the production function receives the updated config.

`GET /api/projects` returns public repositories, sorted with curated mappings first and then by most recently updated. Local Express also exposes `GET /api/health` for a quick server check.