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
  
  const queryString = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';
  const cbcUrl = 'https://www.cbc.ca' + urlPath + queryString;
  
  // Check if user agent is a bot
  const userAgent = req.get('user-agent') || '';
  const isBot = /bot|crawler|spider|crawling|facebook|twitter|discord|slack|telegram|whatsapp|linkedinbot/i.test(userAgent);
  
  // If it's a bot, serve the embed page for scraping
  if (isBot) {
    return res.send(generateEmbedPage(cbcUrl, urlPath));
  }
  
  // If it's a real user, redirect to CBC
  res.redirect(302, cbcUrl);
});

function generateEmbedPage(cbcUrl, urlPath) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OHCBC - ${urlPath}</title>
  <meta name="description" content="View this CBC News article">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${cbcUrl}">
  <meta property="og:title" content=OHDCBC - ${urlPath}">
  <meta property="og:description" content="View this CBC News article">
  <meta property="og:image" content="https://www.cbc.ca/favicon.ico">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${cbcUrl}">
  <meta property="twitter:title" content="OHCBC - ${urlPath}">
  <meta property="twitter:description" content="View this CBC News article">
  <meta property="twitter:image" content="https://www.cbc.ca/favicon.ico">
  
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #1a1a1a; color: #fff; }
    .header { background: #c00; padding: 1rem; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.3); }
    .logo { font-size: 1.5rem; font-weight: bold; display: flex; align-items: center; gap: 0.5rem; }
    .logo span { background: #fff; color: #c00; padding: 0.25rem 0.5rem; border-radius: 4px; }
    .actions { display: flex; gap: 1rem; }
    .btn { background: #fff; color: #c00; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; text-decoration: none; font-weight: 600; transition: all 0.2s; }
    .btn:hover { background: #f0f0f0; transform: translateY(-1px); }
    .container { max-width: 1400px; margin: 2rem auto; padding: 0 1rem; }
    .embed-container { background: #2a2a2a; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
    iframe { width: 100%; height: 80vh; border: none; display: block; }
    .info { background: #2a2a2a; padding: 1.5rem; margin-top: 1rem; border-radius: 8px; }
    .info h2 { margin-bottom: 1rem; color: #c00; }
    .info p { color: #ccc; line-height: 1.6; }
    .url-display { background: #1a1a1a; padding: 1rem; border-radius: 4px; margin-top: 1rem; font-family: monospace; font-size: 0.9rem; word-break: break-all; }
    @media (max-width: 768px) { iframe { height: 60vh; } .actions { flex-direction: column; gap: 0.5rem; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo"><span>DD</span>CBC News</div>
    <div class="actions">
      <a href="${cbcUrl}" target="_blank" class="btn">Open Original</a>
      <button onclick="copyEmbed()" class="btn">Copy Embed Code</button>
    </div>
  </div>
  <div class="container">
    <div class="embed-container">
      <iframe src="${cbcUrl}" allowfullscreen></iframe>
    </div>
    <div class="info">
      <h2>How to use OHCBC</h2>
      <p>Simply add <strong>oh</strong> before <strong>cbc.ca</strong> in any CBC News URL to get an embeddable version!</p>
      <div class="url-display">Original: ${cbcUrl}<br>OHCBC: https://ohcbc.ca${urlPath}</div>
    </div>
  </div>
  <script>
    function copyEmbed() {
      const embedCode = '<iframe src="' + window.location.href + '" width="100%" height="600" frameborder="0" allowfullscreen></iframe>';
      navigator.clipboard.writeText(embedCode).then(() => { alert('Embed code copied to clipboard!'); });
    }
  </script>
</body>
</html>`;
}

app.listen(PORT, () => {
  console.log('OHCBC server running on port ' + PORT);
  console.log('Visit http://localhost:' + PORT);
});
