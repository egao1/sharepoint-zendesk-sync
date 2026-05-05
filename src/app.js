require('dotenv').config();
const path = require('path');
const express = require('express');
const sharepointRouter = require('./routes/sharepoint');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '2mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.redirect('/sharepoint');
});

app.use(
  '/sharepoint-static',
  express.static(path.join(__dirname, '..', 'public', 'sharepoint'))
);
app.use('/sharepoint', sharepointRouter);

app.listen(PORT, () => {
  console.log(`SharePoint <-> Zendesk demo running on port ${PORT}`);
});
