# Perplexity Cookie Extractor

A Chrome/Edge browser extension that extracts Perplexity AI cookies and sends them to your local backend to update the `.env` file automatically.

## Installation

### 1. Load the Extension in Chrome/Edge

1. Open Chrome/Edge and go to `chrome://extensions/` (or `edge://extensions/`)
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `perplexity-cookie-extension` folder

### 2. Add Icons (Optional)

The extension needs icon files. You can:
- Use the provided placeholder icons, or
- Generate new icons using any online icon generator (16x16, 48x48, 128x128 PNG files)

## Usage

1. **Login to Perplexity AI** - Visit [perplexity.ai](https://perplexity.ai) and log in
2. **Click the extension icon** in your browser toolbar
3. The extension will automatically extract cookies
4. Click **"Update .env"** to send cookies to your backend

## Backend Setup

Make sure your backend is running and has the `/api/update-env` endpoint (included in the `cookies.py` route).

```bash
cd d:\localdeepml\backend
python main.py
```

## How It Works

1. The extension uses Chrome's `cookies` API to read cookies from `perplexity.ai`
2. It extracts the following cookies:
   - `__Secure-next-auth.session-token` → `PERPLEXITY_SESSION_TOKEN`
   - `cf_clearance` → `PERPLEXITY_CF_CLEARANCE`  
   - `__cf_bm` → `PERPLEXITY_CF_BM`
   - `pplx.visitor-id` → `PERPLEXITY_VISITOR_ID`
   - `pplx.session-id` → `PERPLEXITY_SESSION_ID`
3. When you click "Update .env", it sends these to your backend
4. The backend updates your `.env` file with the new values

## Configuration

- **Backend URL**: Default is `http://localhost:8000`. Change it in the extension popup if your backend runs on a different port.

## Troubleshooting

- **"No cookies found"**: Make sure you're logged into perplexity.ai
- **"Cannot connect to backend"**: Check that your backend server is running
- **Cookies expire quickly**: Perplexity's `cf_clearance` and `__cf_bm` cookies expire frequently (~30 min). Use the extension to refresh them as needed.
