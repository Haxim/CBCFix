# OHCBC - CBC News Embed Fixer

Just add "dd" before cbc.ca in any CBC News URL to get an embeddable version!

## Usage

Simply add `OH` before `cbc.ca` in any URL:

```
Original: https://www.cbc.ca/news/canada/article-1.123456
Fixed:    https://www.ddcbc.ca/news/canada/article-1.123456
```

The service will redirect to an embeddable player/viewer for that CBC content.

## Features

- 🔗 Simple URL prefix - just add "oh"
- 🚀 Automatic redirect to embeddable version
- 📱 Mobile friendly
- ⚡ Fast and lightweight
- 🎯 Works with all CBC News URLs

## Deployment

### Vercel (Recommended)

1. Fork this repository
2. Connect to Vercel
3. Set custom domain to `ohcbc.ca`
4. Deploy!

### Manual Deployment

```bash
npm install
npm start
```

Set environment variable:
```
PORT=3000
```

## How It Works

1. User visits `ohcbc.ca/news/article`
2. Server catches the request
3. Extracts the path (`/news/article`)
4. Redirects to embeddable CBC content or generates embed page
5. User sees embeddable version

## Contributing

PRs welcome! Please feel free to submit improvements.

## License

MIT
