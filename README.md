# Mystique Portfolio

Portfolio project cards use a checked-in static catalog in `github-projects-config.json`. The same JSON file is served locally and in production; the project list does not call GitHub at runtime and works without a token or outbound API access.

## Run locally

1. Use Node.js 18 or newer.
2. Install dependencies with `npm install`, then start with `npm start`.
3. Open `http://localhost:3000`. The browser must use HTTP to load the JSON catalog; do not open `index.html` directly.

The `github.username` value builds repository and profile links. No GitHub token is needed or used by the static portfolio.

## Categorize repositories

Add or edit entries in `github-projects-config.json` under `github.repos`. Each entry uses `repoName` plus optional `intent`, `subCategory`, `title`, `description`, `deployedUrl`, and `techTags`. For example:

```json
{
  "repoName": "my-repository",
  "intent": "Academic",
  "subCategory": "Algorithms",
  "deployedUrl": "https://demo.example.org",
  "techTags": ["Algorithms", "Research"]
}
```

Every entry in the file is a project card. Add a mapping to include a project; remove one to hide it. Add a `deployedUrl` to display a live-demo link. Repository changes on GitHub are not synced automatically; update this file to keep the catalog current.

Supported intent navigation: `Academic`, `Professional`, `Personal`, `Experimental`, and `Teaching & Narrative`. Category labels are drawn from the repositories assigned to the selected intent, so custom categories work without code changes.

## Deploy to Vercel

Import the repository into Vercel and deploy from the project root. Vercel serves the static site and JSON catalog directly. Redeploy after editing the project catalog to publish the changes.

Local Express exposes `GET /api/health` for a quick server check.