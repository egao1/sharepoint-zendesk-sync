const express = require('express');
const path = require('path');
const {
  getArticleTranslation,
  updateArticleTranslation
} = require('../services/zendesk');
const { ARTICLES, getArticleConfig } = require('../config/articles');

const router = express.Router();

const DEFAULT_LOCALE = process.env.ZENDESK_DEFAULT_LOCALE || 'en-us';

function makeExcerpt(html, max = 160) {
  const text = String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&rsquo;/gi, '\u2019')
    .replace(/&lsquo;/gi, '\u2018')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? text.slice(0, max).trimEnd() + '\u2026' : text;
}

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'sharepoint', 'library.html'));
});

router.get('/api/articles', async (req, res) => {
  const locale = (req.query.locale || DEFAULT_LOCALE).toString();

  try {
    const results = await Promise.all(
      ARTICLES.map(async (cfg) => {
        try {
          const t = await getArticleTranslation(cfg.id, locale);
          return {
            articleId: cfg.id,
            section: cfg.section,
            title: t.title,
            updatedAt: t.updated_at,
            excerpt: makeExcerpt(t.body)
          };
        } catch (err) {
          console.error(`SharePoint demo: failed to load article ${cfg.id}`, err);
          return {
            articleId: cfg.id,
            section: cfg.section,
            title: '(unavailable)',
            updatedAt: null,
            excerpt: '',
            error: err.message
          };
        }
      })
    );
    res.json({ locale, articles: results });
  } catch (err) {
    console.error('SharePoint demo: failed to list articles', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/article/:articleId', async (req, res) => {
  const { articleId } = req.params;
  const locale = (req.query.locale || DEFAULT_LOCALE).toString();
  const cfg = getArticleConfig(articleId);

  try {
    const translation = await getArticleTranslation(articleId, locale);
    res.json({
      articleId,
      locale,
      title: translation.title,
      body: translation.body,
      updatedAt: translation.updated_at,
      section: cfg ? cfg.section : null,
      subdomain: process.env.ZENDESK_SUBDOMAIN || null
    });
  } catch (err) {
    console.error('SharePoint demo: failed to load article', err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.put('/api/article/:articleId', async (req, res) => {
  const { articleId } = req.params;
  const locale = (req.query.locale || DEFAULT_LOCALE).toString();
  const { title, body } = req.body || {};

  if (typeof title !== 'string' && typeof body !== 'string') {
    return res.status(400).json({ error: 'Provide title and/or body' });
  }

  try {
    const translation = await updateArticleTranslation(articleId, locale, { title, body });
    res.json({
      articleId,
      locale,
      title: translation.title,
      updatedAt: translation.updated_at
    });
  } catch (err) {
    console.error('SharePoint demo: failed to update article', err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/:articleId', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'sharepoint', 'index.html'));
});

module.exports = router;
