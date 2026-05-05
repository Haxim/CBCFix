const BOT_USER_AGENT =
  /discord|bot|crawler|spider|facebookexternalhit|twitterbot|slackbot|telegrambot|whatsapp/i;

const FALLBACK_IMAGE = 'https://www.cbc.ca/a/apple-touch-icon.png';

export default {
  async fetch(request) {
    try {
      const url = new URL(request.url);

      if (url.pathname === '/' || url.pathname === '/index.html') {
        return htmlResponse(getHomePage(url.origin));
      }

      if (url.pathname === '/__image') {
        return proxyImage(url);
      }

      const cbcUrl = 'https://www.cbc.ca' + url.pathname + url.search;
      const proxyUrl = url.origin + url.pathname + url.search;

      if (isBrowserRequest(request)) {
        return Response.redirect(cbcUrl, 302);
      }

      const metadata = await fetchMetadata(cbcUrl, url.origin);

      return htmlResponse(
        generateEmbedPage({
          cbcUrl,
          proxyUrl,
          title: metadata.title,
          description: metadata.description,
          image: metadata.image,
          publishedTime: metadata.publishedTime
        })
      );
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
};

function isBrowserRequest(request) {
  const userAgent = request.headers.get('user-agent') || '';

  return /mozilla/i.test(userAgent) && !BOT_USER_AGENT.test(userAgent);
}

async function fetchMetadata(cbcUrl, origin) {
  const fallback = {
    title: 'CBC News Article',
    description: 'View this CBC News article',
    image: proxyImageUrl(FALLBACK_IMAGE, origin),
    publishedTime: ''
  };

  try {
    const response = await fetch(cbcUrl, {
      signal: AbortSignal.timeout(2500),
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (!response.ok) {
      throw new Error('CBC request failed: ' + response.status);
    }

    const html = await response.text();
    const image =
      getMetaContent(html, 'property', 'og:image') ||
      getMetaContent(html, 'name', 'twitter:image') ||
      FALLBACK_IMAGE;

    return {
      title:
        getMetaContent(html, 'property', 'og:title') ||
        getMetaContent(html, 'name', 'twitter:title') ||
        extract(html, /<title[^>]*>([^<]+)<\/title>/i) ||
        fallback.title,
      description:
        getMetaContent(html, 'property', 'og:description') ||
        getMetaContent(html, 'name', 'description') ||
        getMetaContent(html, 'name', 'twitter:description') ||
        fallback.description,
      image: proxyImageUrl(image, origin),
      publishedTime:
        getMetaContent(html, 'property', 'article:published_time') ||
        fallback.publishedTime
    };
  } catch (error) {
    console.error('Metadata fetch failed:', error);
    return fallback;
  }
}

async function proxyImage(url) {
  const imageUrl = url.searchParams.get('url');

  if (!imageUrl) {
    return new Response('Missing image URL', { status: 400 });
  }

  let target;

  try {
    target = new URL(imageUrl);
  } catch {
    return new Response('Invalid image URL', { status: 400 });
  }

  if (!['i.cbc.ca', 'www.cbc.ca', 'cbc.ca'].includes(target.hostname)) {
    return new Response('Image host not allowed', { status: 400 });
  }

  const response = await fetch(target.toString(), {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
    }
  });

  if (!response.ok) {
    return new Response('Image fetch failed', { status: 502 });
  }

  return new Response(response.body, {
    status: 200,
    headers: {
      'content-type': response.headers.get('content-type') || 'image/jpeg',
      'cache-control': 'public, max-age=86400'
    }
  });
}

function proxyImageUrl(image, origin) {
  return origin + '/__image?url=' + encodeURIComponent(image || FALLBACK_IMAGE);
}

function getMetaContent(html, attribute, value) {
  const tagPattern = new RegExp(
    '<meta\\b[^>]*\\b' + attribute + '=["\\\']' + escapeRegex(value) + '["\\\'][^>]*>',
    'i'
  );
  const tag = html.match(tagPattern)?.[0];

  if (!tag) {
    return null;
  }

  const content = tag.match(/\bcontent=["']([^"']*)["']/i)?.[1];
  return content ? decodeHtmlEntities(content) : null;
}

function extract(html, regex) {
  const match = html.match(regex);
  return match ? decodeHtmlEntities(match[1]) : null;
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
}

function generateEmbedPage({
  cbcUrl,
  proxyUrl,
  title,
  description,
  image,
  publishedTime
}) {
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

  <meta property="og:type" content="article">
  <meta property="og:url" content="${safeProxyUrl}">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:image" content="${safeImage}">
  <meta property="og:image:secure_url" content="${safeImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  ${safePublishedTime ? `<meta property="article:published_time" content="${safePublishedTime}">` : ''}

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

function getHomePage(origin) {
  const safeOrigin = escapeHtml(origin);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>OHCBC</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      max-width: 720px;
      margin: 0 auto;
      padding: 48px 20px;
      line-height: 1.5;
    }

    code {
      background: #f1f1f1;
      padding: 2px 6px;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <h1>OHCBC</h1>
  <p>Add <strong>oh</strong> before <code>cbc.ca</code> in a CBC News URL.</p>
  <p>Example:</p>
  <p><code>${safeOrigin}/news/canada/example</code></p>
</body>
</html>`;
}

function htmlResponse(html) {
  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=UTF-8',
      'cache-control': 'public, max-age=300'
    }
  });
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
