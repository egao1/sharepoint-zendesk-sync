# SharePoint &harr; Zendesk Help Center Sync (Demo)

A mock Microsoft SharePoint article page. Edits to the title and body
are pushed in near real time to a real Zendesk Help Center article via
the Help Center Translations API.

Built as a sales/demo tool to show how an external knowledge source
(SharePoint, Confluence, Notion, etc.) can be wired into Zendesk so
that a single source of truth stays in sync with your published Help
Center.

## How it works

```
Browser (Quill rich-text editor on a SharePoint-styled page)
   |  GET  /sharepoint/api/article/:id
   |  PUT  /sharepoint/api/article/:id  (debounced ~800ms)
   v
Express middleware
   |  GET  /api/v2/help_center/articles/:id/translations/:locale
   |  PUT  /api/v2/help_center/articles/:id/translations/:locale
   v
Zendesk Help Center
```

- One-way sync, SharePoint &rarr; Zendesk
- Title + body HTML
- Quill 2.x toolbar: H2/H3, bold/italic/underline, lists, link, blockquote
- Live status pill: `Loading\u2026 / Editing\u2026 / Saving\u2026 / Synced \u2713 <ago> / Sync failed \u2014 click to retry`
- Single in-flight request with one queued follow-up so changes always converge

## Local development

```bash
npm install
cp .env.example .env
# fill in ZENDESK_* values
npm run dev
open http://localhost:3000/
# (or http://localhost:3000/sharepoint/<articleId>)
```

## Environment variables

| Variable | Description |
| --- | --- |
| `ZENDESK_SUBDOMAIN` | Your Zendesk instance, e.g. `acme` for `acme.zendesk.com` |
| `ZENDESK_EMAIL` | Admin/Help Center manager email |
| `ZENDESK_API_TOKEN` | API token from Admin Center &rarr; Apps and integrations &rarr; Zendesk API |
| `ZENDESK_DEFAULT_ARTICLE_ID` | Default article shown at `/` |
| `ZENDESK_DEFAULT_LOCALE` | Locale slug for the translation, default `en-us` |
| `PORT` | HTTP port, default `3000` |

## Deploy on Railway

1. Push this repo to GitHub.
2. Create a Railway project from the GitHub repo.
3. In **Variables**, paste the same five `ZENDESK_*` values plus `PORT` (Railway assigns one automatically; you can omit `PORT`).
4. Railway builds with Nixpacks (`npm start`) and exposes a public URL.
5. Visit `https://<your-app>.up.railway.app/` &mdash; it redirects to `/sharepoint/<ZENDESK_DEFAULT_ARTICLE_ID>`.

## Project structure

```
src/
  app.js                 # Express bootstrap
  routes/sharepoint.js   # GET page, GET/PUT article JSON
  services/zendesk.js    # Zendesk Help Center client
public/sharepoint/
  index.html             # SharePoint-styled page chrome
  styles.css             # Fluent-ish theme
  app.js                 # Quill editor + debounced autosave state machine
.env.example
railway.json
package.json
```

## Out of scope (kept simple for the demo)

- Reverse direction (Zendesk &rarr; SharePoint mock) &mdash; would need polling or a Zendesk webhook on `article.updated`.
- Conflict resolution / multi-editor presence.
- Real SharePoint API (Microsoft Graph) integration. The page is a fidelity-only mock; the **sync** to Zendesk is real.
- Image uploads (Quill embeds images as base64; Zendesk accepts that but bloats the body).
