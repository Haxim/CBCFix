module.exports = async (req, res) => {
  try {
    const urlPath = req.url.split('?')[0];
    const queryString = req.url.includes('?')
      ? '?' + req.url.split('?')[1]
      : '';

    if (urlPath === '/' || urlPath === '/index.html') {
      return res.status(200).send('OHCBC API OK');
    }

    const cbcUrl = 'https://www.cbc.ca' + urlPath + queryString;
    const proxyUrl = 'https://www.ohcbc.ca' + urlPath + queryString;

    console.log('CBC URL:', cbcUrl);

    let title = 'CBC News Article';
    let description = 'View this CBC News article';
    let image = 'https://www.ohcbc.ca/social.png';
    let publishedTime = '';

    // Fetch CBC page and extract metadata
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);

      const response = await fetch(cbcUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });

      clearTimeout(timeout);

      const html = await response.text();

      const extract = (regex) => {
        const match = html.match(regex);
        return match ? match[1] : null;
      };

      title =
        extract(/<meta property="og:title" content="([^"]+)"/i) ||
        extract(/<title>([^<]+)<\/title>/i) ||
        title;

      description =
        extract(/<meta property="og:description" content="([^"]+)"/i) ||
        extract(/<meta name="description" content="([^"]+)"/i) ||
        description;

      image =
        extract(/<meta property="og:image" content="([^"]+)"/i) ||
        image;

      publishedTime =
        extract(/<meta property="article:published_time" content="([^"]+)"/i) ||
        '';

      title = title.replace(/&#x27;/g, "'");

      console.log('Extracted - Title:', title);
      console.log('Extracted - Description:', description);
      console.log('Extracted - Image:', image);
      console.log('Extracted - Published Time:', publishedTime);
    } catch (fetchError) {
      console.error('Metadata fetch failed:', fetchError);
      // fallback metadata is already set above
    }

    return res.status(200).send(
      generateEmbedPage({
        cbcUrl,
        proxyUrl,
        urlPath,
        title,
        description,
        image,
        publishedTime
      })
    );
  } catch (error) {
    console.error('FATAL ERROR:', error);
    return res.status(500).send('Internal Server Error');
  }
};

function generateEmbedPage({
  cbcUrl,
  proxyUrl,
  urlPath,
  title,
  description,
  image,
  publishedTime
}) {
  const escapeHtml = (str = '') =>
    String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeImage = escapeHtml(image);
  const safeCbcUrl = escapeHtml(cbcUrl);
  const safeProxyUrl = escapeHtml(proxyUrl);
  const safePublishedTime = escapeHtml(publishedTime);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>${safeTitle}</title>
  <meta name="description" content="${safeDescription}">
  <link rel="canonical" href="${safeProxyUrl}">

  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${safeProxyUrl}">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:image" content="${safeImage}">
  ${safePublishedTime ? `<meta property="article:published_time" content="${safePublishedTime}">` : ''}

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${safeProxyUrl}">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDescription}">
  <meta name="twitter:image" content="${safeImage}">

  <meta http-equiv="refresh" content="0; url=${safeCbcUrl}">
</head>
<body>
  <p>Redirecting to <a href="${safeCbcUrl}">CBC article</a>...</p>
</body>
</html>`;
}
