// =============================
// /server.js
// =============================

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('*', (req, res) => {
  const urlPath = req.path;

  if (urlPath === '/' || urlPath === '/index.html') {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }

  const queryString = req.url.includes('?')
    ? '?' + req.url.split('?')[1]
    : '';

  const cbcUrl = 'https://www.cbc.ca' + urlPath + queryString;

  // Browser detection: real browsers redirect to CBC,
  // scrapers (Discord, Slack, etc.) get the metadata page
  const userAgent = req.headers['user-agent'] || '';

  const isBrowser =
    /mozilla/i.test(userAgent) &&
    !/discord|bot|crawler|spider|facebookexternalhit|twitterbot|slackbot|telegrambot|whatsapp/i.test(userAgent);

  console.log('UA:', userAgent);
  console.log('isBrowser:', isBrowser);
  console.log('PATH:', req.path);

  if (isBrowser) {
    return res.redirect(302, cbcUrl);
  }

  // Non-browser traffic should hit the API route on Vercel,
  // but for local fallback this still works
  res.redirect(302, '/api' + urlPath + queryString);
});

app.listen(PORT, () => {
  console.log('OHCBC server running on port ' + PORT);
  console.log('Visit http://localhost:' + PORT);
});
