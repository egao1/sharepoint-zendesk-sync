// Articles surfaced in the mock SharePoint "Site Pages" library.
// To add a new article: append { id, section } here. Title and
// updated_at are fetched live from Zendesk so they stay current.
const ARTICLES = [
  {
    id: '46607575597460',
    section: 'Technology & Work Efficiency Support'
  },
  {
    id: '46607597739156',
    section: 'Total Rewards & Personal Information Management'
  },
  {
    id: '46607607335572',
    section: 'Total Rewards & Personal Information Management'
  }
];

function getArticleConfig(articleId) {
  return ARTICLES.find((a) => a.id === String(articleId)) || null;
}

module.exports = {
  ARTICLES,
  getArticleConfig
};
