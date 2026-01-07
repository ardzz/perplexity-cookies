// Cookie names we need to extract (with possible variations)
const COOKIE_PATTERNS = [
    { patterns: ['__Secure-next-auth.session-token', 'next-auth.session-token'], envName: 'PERPLEXITY_SESSION_TOKEN' },
    { patterns: ['cf_clearance'], envName: 'PERPLEXITY_CF_CLEARANCE' },
    { patterns: ['__cf_bm'], envName: 'PERPLEXITY_CF_BM' },
    { patterns: ['pplx.visitor-id', 'visitor-id'], envName: 'PERPLEXITY_VISITOR_ID' },
    { patterns: ['pplx.session-id', 'session-id'], envName: 'PERPLEXITY_SESSION_ID' }
];

// For display purposes
const REQUIRED_COOKIES = COOKIE_PATTERNS.map(p => p.patterns[0]);

// Map cookie names to env var names (built dynamically)
const COOKIE_TO_ENV = {};
COOKIE_PATTERNS.forEach(p => {
    p.patterns.forEach(pattern => {
        COOKIE_TO_ENV[pattern] = p.envName;
    });
});

let extractedCookies = null;

// DOM Elements
const statusEl = document.getElementById('status');
const statusIconEl = statusEl.querySelector('.status-icon');
const statusTextEl = statusEl.querySelector('.status-text');
const cookiesPreviewEl = document.getElementById('cookiesPreview');
const extractBtn = document.getElementById('extractBtn');
const sendBtn = document.getElementById('sendBtn');
const backendUrlEl = document.getElementById('backendUrl');

// Load saved backend URL
chrome.storage.local.get(['backendUrl'], (result) => {
    if (result.backendUrl) {
        backendUrlEl.value = result.backendUrl;
    }
});

// Save backend URL on change
backendUrlEl.addEventListener('change', () => {
    chrome.storage.local.set({ backendUrl: backendUrlEl.value });
});

function setStatus(type, icon, text) {
    statusEl.className = `status ${type}`;
    statusIconEl.textContent = icon;
    statusTextEl.textContent = text;
}

function renderCookiesPreview(cookies) {
    if (!cookies || Object.keys(cookies).length === 0) {
        cookiesPreviewEl.innerHTML = '<div class="preview-placeholder">No cookies found</div>';
        return;
    }

    const html = REQUIRED_COOKIES.map(name => {
        const value = cookies[name];
        const envName = COOKIE_TO_ENV[name];
        if (value) {
            const truncatedValue = value.length > 50 ? value.substring(0, 50) + '...' : value;
            return `
        <div class="cookie-item">
          <span class="cookie-name cookie-found">✓ ${envName}</span>
          <span class="cookie-value">${truncatedValue}</span>
        </div>
      `;
        } else {
            return `
        <div class="cookie-item">
          <span class="cookie-name cookie-missing">✗ ${envName}</span>
          <span class="cookie-value">Not found</span>
        </div>
      `;
        }
    }).join('');

    cookiesPreviewEl.innerHTML = html;
}

async function extractCookies() {
    setStatus('loading', '⏳', 'Extracting cookies...');
    extractBtn.disabled = true;

    try {
        // Get cookies from multiple domain patterns
        const domains = ['perplexity.ai', '.perplexity.ai', 'www.perplexity.ai'];
        let allCookies = [];

        for (const domain of domains) {
            try {
                const cookies = await chrome.cookies.getAll({ domain });
                allCookies = allCookies.concat(cookies);
            } catch (e) {
                console.log(`No cookies for domain: ${domain}`);
            }
        }

        // Also try getting ALL cookies and filter by perplexity
        try {
            const allBrowserCookies = await chrome.cookies.getAll({});
            const perplexityCookies = allBrowserCookies.filter(c =>
                c.domain.includes('perplexity')
            );
            allCookies = allCookies.concat(perplexityCookies);
        } catch (e) {
            console.log('Could not get all cookies:', e);
        }

        // Debug: Log all found cookies
        console.log('=== All Perplexity Cookies Found ===');
        const uniqueCookies = new Map();
        allCookies.forEach(cookie => {
            const key = `${cookie.name}@${cookie.domain}`;
            if (!uniqueCookies.has(key)) {
                uniqueCookies.set(key, cookie);
                console.log(`Cookie: ${cookie.name} | Domain: ${cookie.domain} | Value: ${cookie.value.substring(0, 30)}...`);
            }
        });
        console.log(`Total unique cookies: ${uniqueCookies.size}`);

        // Build a map of cookie name -> value (normalized)
        // Use the first matching pattern for each env var
        const normalizedMap = {};
        const rawCookieMap = {};

        uniqueCookies.forEach(cookie => {
            rawCookieMap[cookie.name] = cookie.value;
        });

        // Find cookies matching our patterns
        COOKIE_PATTERNS.forEach(({ patterns, envName }) => {
            for (const pattern of patterns) {
                if (rawCookieMap[pattern]) {
                    // Store using the primary pattern name for display
                    normalizedMap[patterns[0]] = rawCookieMap[pattern];
                    break;
                }
            }
        });

        // Check if we got the required cookies
        const foundCount = REQUIRED_COOKIES.filter(name => normalizedMap[name]).length;

        if (foundCount === 0) {
            setStatus('error', '❌', 'No cookies found. Visit perplexity.ai first!');
            renderCookiesPreview({});
            extractedCookies = null;
            sendBtn.disabled = true;

            // Show debug info
            console.log('=== Debug: Available cookie names ===');
            uniqueCookies.forEach(cookie => {
                console.log(`- ${cookie.name}`);
            });
        } else {
            extractedCookies = normalizedMap;
            setStatus('success', '✅', `Found ${foundCount}/${REQUIRED_COOKIES.length} cookies`);
            renderCookiesPreview(normalizedMap);
            sendBtn.disabled = false;
        }
    } catch (error) {
        console.error('Extract error:', error);
        setStatus('error', '❌', `Error: ${error.message}`);
        extractedCookies = null;
        sendBtn.disabled = true;
    } finally {
        extractBtn.disabled = false;
    }
}

async function sendToBackend() {
    if (!extractedCookies) {
        setStatus('error', '❌', 'No cookies to send');
        return;
    }

    const backendUrl = backendUrlEl.value.replace(/\/$/, '');
    setStatus('loading', '⏳', 'Updating .env...');
    sendBtn.disabled = true;

    try {
        // Build env vars payload
        const envVars = {};
        for (const [cookieName, envName] of Object.entries(COOKIE_TO_ENV)) {
            if (extractedCookies[cookieName]) {
                envVars[envName] = extractedCookies[cookieName];
            }
        }

        const response = await fetch(`${backendUrl}/api/update-env`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cookies: envVars,
                timestamp: new Date().toISOString()
            })
        });

        if (response.ok) {
            const result = await response.json();
            setStatus('success', '✅', result.message || '.env updated successfully!');
        } else {
            const error = await response.text();
            setStatus('error', '❌', `Server error: ${response.status}`);
            console.error('Server response:', error);
        }
    } catch (error) {
        console.error('Send error:', error);
        if (error.message.includes('Failed to fetch')) {
            setStatus('error', '❌', 'Cannot connect to backend. Is it running?');
        } else {
            setStatus('error', '❌', `Error: ${error.message}`);
        }
    } finally {
        sendBtn.disabled = false;
    }
}

// Event listeners
extractBtn.addEventListener('click', extractCookies);
sendBtn.addEventListener('click', sendToBackend);

// Auto-extract on popup open
extractCookies();
