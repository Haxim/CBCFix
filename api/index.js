const path = require('path');
const fs = require('fs');

module.exports = (req, res) => {
  const urlPath = req.url;
  
  if (urlPath === '/' || urlPath === '/index.html') {
    const indexPath = path.join(__dirname, '..', 'public', 'index.html');
    const html = fs.readFileSync(indexPath, 'utf8');
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  }
  
  const cbcUrl = 'https://www.cbc.ca' + urlPath;
  res.setHeader('Content-Type', 'text/html');
  res.send(generateEmbedPage(cbcUrl, urlPath));
};

function generateEmbedPage(cbcUrl, urlPath) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DDCBC - ${urlPath}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #1a1a1a; color: #fff; }
    .header { background: #c00; padding: 1rem; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.3); }
    .logo { font-size: 1.5rem; font-weight: bold; display: flex; align-items: center; gap: 0.5rem; }
    .logo span { background: #fff; color: #c00; padding: 0.25rem 0.5rem; border-radius: 4px; }
    .actions { display: flex; gap: 1rem; }
    .btn { background: #fff; color: #c00; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; text-decoration: none; font-weight: 600; transition: all 0.2s; }
    .container { max-width: 1400px; margin: 2rem auto; padding: 0 1rem; }
    .embed-container { background: #2a2a2a; border-radius: 8px; overflow: hidden; }
    iframe { width: 100%; height: 80vh; border: none; display: block; }
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
  </div>
  <script>
    function copyEmbed() {
      const embedCode = '<iframe src="' + window.location.href + '" width="100%" height="600" frameborder="0" allowfullscreen></iframe>';
      navigator.clipboard.writeText(embedCode).then(() => { alert('Embed code copied!'); });
    }
  </script>
</body>
</html>`;
}
