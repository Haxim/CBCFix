const path = require('path');
const fs = require('fs');

module.exports = async (req, res) => {
  const urlPath = req.url;
  
  if (urlPath === '/' || urlPath === '/index.html') {
    const indexPath = path.join(__dirname, '..', 'public', 'index.html');
    const html = fs.readFileSync(indexPath, 'utf8');
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  }
  
  const cbcUrl = 'https://www.cbc.ca' + urlPath;
  
  // Fetch the original CBC page to extract meta tags
  let title = 'CBC News Article';
  let description = 'View this CBC News article';
  let image = 'https://www.cbc.ca/favicon.ico';
  
  try {
    const response = await fetch(cbcUrl);
    const html = await response.text();
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) title = titleMatch[1].trim();
    
    // Extract description - try multiple patterns
    let descMatch = null;
    
    // Pattern 1: data-rh with name="description"
    descMatch = html.match(/<meta[^>]*data-rh=["']true["'][^>]*name=["']description["'][^>]*content=["']([^"']+)["']/is);
    
    if (!descMatch) {
      // Pattern 2: name="description" with data-rh (reversed order)
      descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*data-rh=["']true["'][^>]*content=["']([^"']+)["']/is);
    }
    
    if (!descMatch) {
      // Pattern 3: just name="description" with content
      descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/is);
    }
    
    if (!descMatch) {
      // Pattern 4: og:description
      descMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/is);
    }
    
    if (descMatch) {
      description = descMatch[1].trim();
      // Truncate if too long (Discord shows ~200 chars)
      if (description.length > 200) {
        description = description.substring(0, 197) + '...';
      }
    }
    
    // Extract og:image
    const imgMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/is);
    if (!imgMatch) {
      const twitterImgMatch = html.match(/<meta[^>]*property=["']twitter:image["'][^>]*content=["']([^"']+)["']/is);
      if (twitterImgMatch) image = twitterImgMatch[1].trim();
    } else {
      image = imgMatch[1].trim();
    }
    
    // Debug logging
    console.log('Extracted - Title:', title);
    console.log('Extracted - Description:', description);
    console.log('Extracted - Image:', image);
  } catch (error) {
    console.error('Error fetching CBC page:', error);
  }
  
  res.setHeader('Content-Type', 'text/html');
  res.send(generateEmbedPage(cbcUrl, urlPath, title, description, image));
};

function generateEmbedPage(cbcUrl, urlPath, title, description, image) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${cbcUrl}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${cbcUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${cbcUrl}">
  <meta property="twitter:title" content="${title}">
  <meta property="twitter:description" content="${description}">
  <meta property="twitter:image" content="${image}">
  
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
    @media (max-width: 768px) { .actions { flex-direction: column; gap: 0.5rem; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo"><span>CBC</span>Fix</div>
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
    // Redirect real users to CBC, but let bots scrape the metadata
    if (!/bot|crawler|spider|crawling/i.test(navigator.userAgent)) {
      window.location.href = '${cbcUrl}';
    }
    
    function copyEmbed() {
      const embedCode = '<iframe src="' + window.location.href + '" width="100%" height="600" frameborder="0" allowfullscreen></iframe>';
      navigator.clipboard.writeText(embedCode).then(() => { alert('Embed code copied!'); });
    }
  </script>
</body>
</html>`;
}
