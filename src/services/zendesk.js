const SUBDOMAIN = process.env.ZENDESK_SUBDOMAIN;
const EMAIL = process.env.ZENDESK_EMAIL;
const API_TOKEN = process.env.ZENDESK_API_TOKEN;

function baseUrl() {
  if (!SUBDOMAIN) {
    throw new Error('ZENDESK_SUBDOMAIN is not configured');
  }
  return `https://${SUBDOMAIN}.zendesk.com/api/v2`;
}

function authHeader() {
  if (!EMAIL || !API_TOKEN) {
    throw new Error('ZENDESK_EMAIL or ZENDESK_API_TOKEN is not configured');
  }
  const credentials = `${EMAIL}/token:${API_TOKEN}`;
  return 'Basic ' + Buffer.from(credentials).toString('base64');
}

async function getArticleTranslation(articleId, locale) {
  const url = `${baseUrl()}/help_center/articles/${articleId}/translations/${locale}.json`;
  const response = await fetch(url, {
    headers: { 'Authorization': authHeader() }
  });

  if (!response.ok) {
    const text = await response.text();
    const err = new Error(`Zendesk GET translation failed: ${response.status} ${text}`);
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  return data.translation;
}

async function updateArticleTranslation(articleId, locale, { title, body }) {
  const payload = { translation: {} };
  if (typeof title === 'string') payload.translation.title = title;
  if (typeof body === 'string') payload.translation.body = body;

  const url = `${baseUrl()}/help_center/articles/${articleId}/translations/${locale}.json`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': authHeader(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    const err = new Error(`Zendesk PUT translation failed: ${response.status} ${text}`);
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  return data.translation;
}

module.exports = {
  getArticleTranslation,
  updateArticleTranslation
};
