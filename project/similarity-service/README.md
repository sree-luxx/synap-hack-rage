# Similarity Service (jscpd)

A minimal HTTP service that computes code similarity between two git repositories using jscpd. Returns a similarity score in [0,1] and full jscpd JSON details.

## API

- POST /compare
  - Body: `{ "repoA": "https://...", "repoB": "https://..." }`
  - Headers: `Authorization: Bearer <SIMILARITY_API_KEY>` if configured
  - Response: `{ "score": number, "details": any }`
- GET /health

## Run locally

```bash
cd similarity-service
npm ci
SIMILARITY_API_KEY=dev-key node src/server.js
# test
curl -X POST http://localhost:3001/compare \
  -H "Authorization: Bearer dev-key" \
  -H "Content-Type: application/json" \
  -d '{"repoA":"https://github.com/jquery/jquery","repoB":"https://github.com/lodash/lodash"}'
```

## Docker

```bash
docker build -t similarity-service:latest similarity-service
docker run --rm -p 3001:3001 -e SIMILARITY_API_KEY=dev-key similarity-service:latest
```

## Configure HackHub backend

Set in `hackhub/.env.local`:

```
SIMILARITY_API_URL=http://your-host:3001/compare
SIMILARITY_API_KEY=dev-key
```

Notes:
- Private repos: include a token in clone URL (e.g., https://<token>@github.com/org/repo) or mount SSH keys and configure git.
- Increase container CPU/memory for large repos. The request can take 10–60s.
