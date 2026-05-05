# SharePoint &harr; Zendesk Help Center Sync (Demo)

A mock Microsoft SharePoint site that lists a small library of "Site Pages"
and lets you edit each one in a SharePoint-style WYSIWYG editor. Edits to
the title and body are pushed in near real time to a real Zendesk Help
Center article via the Help Center Translations API.

Built as a sales/demo tool to show how an external knowledge source
(SharePoint, Confluence, Notion, etc.) can be wired into Zendesk so
that a single source of truth stays in sync with your published Help
Center.

## How it works

```
                                 +-----------------------------+
Browser  /sharepoint  ---------> | Library: Site Pages list    |
                                 |   GET  /sharepoint/api/articles
                                 +--------------+--------------+
                                                |
                                                v   click a row
                                 +-----------------------------+
Browser  /sharepoint/<id>  ----> | Editor: Quill rich-text     |
                                 |   GET  /sharepoint/api/article/:id
                                 |   PUT  /sharepoint/api/article/:id
                                 +--------------+--------------+
                                                |
                                                v
                                 +-----------------------------+
                                 | Zendesk Help Center          |
                                 |   /help_center/articles/...  |
                                 |     /translations/<locale>   |
                                 +-----------------------------+
```

- One-way sync, SharePoint &rarr; Zendesk
- Title + body HTML
- Quill 2.x toolbar: H2/H3, bold/italic/underline, lists, link, blockquote
- Live status pill: `Loading\u2026 / Editing\u2026 / Saving\u2026 / Synced \u2713 <ago> / Sync failed \u2014 click to retry`
- Single in-flight request with one queued follow-up so changes always converge
- Article list is fetched live from Zendesk every page load, so titles, modified times, and excerpts always match the published article

## Local development

```bash
npm install
cp .env.example .env
# fill in ZENDESK_* values
npm run dev
open http://localhost:3000/
```

## Adding or removing articles

The articles surfaced in the Site Pages library live in
[`src/config/articles.js`](src/config/articles.js):

```js
const ARTICLES = [
  { id: '46607575597460', section: 'Technology & Work Efficiency Support' },
  { id: '46607597739156', section: 'Total Rewards & Personal Information Management' },
  { id: '46607607335572', section: 'Total Rewards & Personal Information Management' }
];
```

To add a new article: append a `{ id, section }` entry. The `id` is the
numeric ID at the end of the Zendesk article URL; `section` is the human
label used in the breadcrumb on the editor view and in the **Section**
column of the library. Title and modified time come live from Zendesk.

## Environment variables

| Variable | Description |
| --- | --- |
| `ZENDESK_SUBDOMAIN` | Your Zendesk instance, e.g. `acme` for `acme.zendesk.com` |
| `ZENDESK_EMAIL` | Admin/Help Center manager email |
| `ZENDESK_API_TOKEN` | API token from Admin Center &rarr; Apps and integrations &rarr; Zendesk API |
| `ZENDESK_DEFAULT_LOCALE` | Locale slug for the translation, default `en-us` |
| `PORT` | HTTP port, default `3000` |

## Deploy on Railway

1. Push this repo to GitHub.
2. Create a Railway project from the GitHub repo.
3. In **Variables**, paste the four `ZENDESK_*` values and `PORT=3000`.
4. Railway builds with Nixpacks (`npm start`) and exposes a public URL.
5. Visit `https://<your-app>.up.railway.app/` &mdash; it redirects to `/sharepoint`, the Site Pages library.

## Project structure

```
src/
  app.js                  # Express bootstrap; / -> /sharepoint
  config/articles.js      # Article id + section pairs surfaced in the library
  routes/sharepoint.js    # GET library, GET/PUT article JSON, GET editor page
  services/zendesk.js     # Zendesk Help Center client
public/sharepoint/
  library.html            # Site Pages library (list view)
  library.js              # Fetch & render rows
  index.html              # SharePoint-styled editor chrome
  app.js                  # Quill editor + debounced autosave state machine
  styles.css              # Fluent-ish theme (shared by library and editor)
.env.example
railway.json
package.json
```

## Routes

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/` | Redirects to `/sharepoint` |
| `GET` | `/health` | Liveness probe (used by Railway) |
| `GET` | `/sharepoint` | Site Pages library (HTML) |
| `GET` | `/sharepoint/api/articles` | JSON list of all configured articles |
| `GET` | `/sharepoint/:articleId` | Editor page (HTML) |
| `GET` | `/sharepoint/api/article/:id` | One article (title, body, section, updatedAt) |
| `PUT` | `/sharepoint/api/article/:id` | Updates the Zendesk article (debounced from the editor) |

## Out of scope (kept simple for the demo)

- Reverse direction (Zendesk &rarr; SharePoint mock) &mdash; would need polling or a Zendesk webhook on `article.updated`.
- Conflict resolution / multi-editor presence.
- Real SharePoint API (Microsoft Graph) integration. The page is a fidelity-only mock; the **sync** to Zendesk is real.
- Image uploads (Quill embeds images as base64; Zendesk accepts that but bloats the body).
