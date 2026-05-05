# OHCBC - CBC News Embed Fixer

OHCBC is a single-file Cloudflare Worker. Add `oh` before `cbc.ca` in a CBC News URL to get social embed metadata that works better in chat apps.

## Cloudflare Web Editor

1. Open Cloudflare Workers.
2. Create or edit a Worker.
3. Paste the contents of `worker.js` into the Cloudflare editor.
4. Deploy.
5. Add a route or custom domain such as `ohcbc.ca/*` or `www.ohcbc.ca/*`.

No Vercel API routes, Express server, Docker image, or static asset upload is required.

## Local Development

```bash
npm install
npm run dev
```

## Deployment From This Repo

```bash
npm run deploy
```

`wrangler.jsonc` points directly at `worker.js`, so the CLI deploys the same code that you can paste into Cloudflare's web editor.

## How It Works

1. Browser requests redirect to the matching `https://www.cbc.ca/...` URL.
2. Crawler requests fetch the CBC article HTML and extract Open Graph or Twitter metadata.
3. CBC article images are proxied through the Worker at `/__image` so link preview clients can fetch them reliably.
4. The Worker returns lightweight HTML with the copied metadata and a refresh redirect to CBC.

## License

MIT
