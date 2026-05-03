const express = require('express');
const path = require('path');
const {
  getArticleTranslation,
  updateArticleTranslation
} = require('../services/zendesk');

const router = express.Router();

const DEFAULT_LOCALE = process.env.ZENDESK_DEFAULT_LOCALE || 'en-us';
const DEFAULT_ARTICLE_ID = process.env.ZENDESK_DEFAULT_ARTICLE_ID;

router.get('/', (req, res) => {
  if (DEFAULT_ARTICLE_ID) {
    return res.redirect(`/sharepoint/${DEFAULT_ARTICLE_ID}`);
  }
  res
    .status(400)
    .send('No article id provided and ZENDESK_DEFAULT_ARTICLE_ID is not set.');
});

router.get('/api/article/:articleId', async (req, res) => {
  const { articleId } = req.params;
  const locale = (req.query.locale || DEFAULT_LOCALE).toString();

  try {
    const translation = await getArticleTranslation(articleId, locale);
    res.json({
      articleId,
      locale,
      title: translation.title,
      body: translation.body,
      updatedAt: translation.updated_at,
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
