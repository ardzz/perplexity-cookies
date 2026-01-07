# Perplexity Cookie Extractor

A Chrome/Edge browser extension that extracts Perplexity AI authentication cookies for use with API integrations and automation scripts.

## Extracted Cookies

| Browser Cookie | Environment Variable |
|----------------|---------------------|
| `__Secure-next-auth.session-token` | `PERPLEXITY_SESSION_TOKEN` |
| `cf_clearance` | `PERPLEXITY_CF_CLEARANCE` |
| `__cf_bm` | `PERPLEXITY_CF_BM` |
| `pplx.visitor-id` | `PERPLEXITY_VISITOR_ID` |
| `pplx.session-id` | `PERPLEXITY_SESSION_ID` |

## Installation

1. Open Chrome/Edge and go to `chrome://extensions/` (or `edge://extensions/`)
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select this extension folder

## Usage

1. **Login to Perplexity AI** - Visit [perplexity.ai](https://perplexity.ai) and log in
2. **Click the extension icon** in your browser toolbar
3. Cookies are automatically extracted and displayed

### Option A: Copy to Clipboard
View the extracted cookies in the popup and manually copy them to your `.env` file or configuration.

### Option B: Send to Backend
If you have a backend server with a `/api/update-env` endpoint:

1. Enter your backend URL in the extension (default: `http://localhost:8000`)
2. Click **"Update .env"** to send cookies automatically

**Expected endpoint**: `POST /api/update-env`
```json
{
  "cookies": {
    "PERPLEXITY_SESSION_TOKEN": "...",
    "PERPLEXITY_CF_CLEARANCE": "...",
    "PERPLEXITY_CF_BM": "...",
    "PERPLEXITY_VISITOR_ID": "...",
    "PERPLEXITY_SESSION_ID": "..."
  },
  "timestamp": "2024-01-07T12:00:00.000Z"
}
```

## Troubleshooting

- **"No cookies found"**: Make sure you're logged into perplexity.ai
- **"Cannot connect to backend"**: Check that your backend server is running
- **Cookies expire quickly**: Cloudflare cookies (`cf_clearance`, `__cf_bm`) expire frequently (~30 min). Re-extract as needed.

## License

MIT
