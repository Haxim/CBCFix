module.exports = async (req, res) => {
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
