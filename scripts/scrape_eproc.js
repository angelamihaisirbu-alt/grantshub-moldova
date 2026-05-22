#!/usr/bin/env node
// GrantsHub Moldova - eProc Council of Europe scraper
// Fetches https://eproc.coe.int/home and looks for procurement notices targeting Moldova.
// Writes new candidates to data.js as autoDetected: true (hidden from public until reviewed).

const https = require('https');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'data.js');
const REPORT_FILE = path.join(__dirname, 'eproc_report.md');

// LIMITATION: eproc.coe.int is a Single Page Application — HTML returns only app shell.
// The /api/callfortenders/{id} endpoint exists but returns 401 (auth required).
// Without headless browser or auth token, we can only catch tenders that appear
// in static <a> tags with "moldova" in title/href (rare on listing page).
// Specific tenders should be added manually to data.js (see coe-eproc-11339).
const EPROC_HOME = 'https://eproc.coe.int/home';
const EPROC_TENDERS = [
    'https://eproc.coe.int/home',
    'https://eproc.coe.int/tenders'
];

const MOLDOVA_KEYWORDS = ['moldova', 'chisinau', 'chișinău', 'republic of moldova', 'republica moldova'];

function fetch(url, redirects = 5) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, {
            headers: {
                'User-Agent': 'GrantsHubMoldova-eProc/1.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml'
            }
        }, res => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects > 0) {
                const next = res.headers.location.startsWith('http') ? res.headers.location : new URL(res.headers.location, url).toString();
                return fetch(next, redirects - 1).then(resolve, reject);
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
            }
            let data = '';
            res.setEncoding('utf8');
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ url, html: data }));
        });
        req.on('error', reject);
        req.setTimeout(30000, () => req.destroy(new Error('Request timeout')));
    });
}

function decodeHtmlEntities(s) {
    const named = { '&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' ','&#039;':"'",'&#39;':"'",'&#34;':'"' };
    return s
        .replace(/&[a-z]+;|&#0?39;|&#0?34;/gi, m => named[m.toLowerCase()] || m)
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
        .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function slugify(s) {
    return s.toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50)
        .replace(/-+$/, '');
}

function todayISO() { return new Date().toISOString().slice(0, 10); }
function plusDays(n) { const d = new Date(); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }

function findMoldovaTenders(html, baseUrl) {
    const tenders = [];
    // Strategy: extract all <tr> / <li> blocks or links that contain Moldova keyword AND a tender-like URL
    // CoE eProc typically uses table rows or card lists. Look for anchor tags with tender details.
    const anchorRe = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    const seen = new Set();
    let m;
    while ((m = anchorRe.exec(html)) !== null) {
        const href = m[1];
        const innerText = decodeHtmlEntities(m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')).trim();
        if (innerText.length < 8) continue;
        // Skip nav/UI links
        if (/^(Home|Login|Search|Help|FAQ|Logout|Tenders|Contact|Languages?)$/i.test(innerText)) continue;

        const lowerText = innerText.toLowerCase();
        const lowerHref = href.toLowerCase();
        const matches = MOLDOVA_KEYWORDS.some(kw => lowerText.includes(kw) || lowerHref.includes(kw));
        if (!matches) continue;

        // Build absolute URL
        let fullUrl;
        try { fullUrl = new URL(href, baseUrl).toString(); }
        catch { continue; }

        if (seen.has(fullUrl)) continue;
        seen.add(fullUrl);
        tenders.push({ title: innerText, url: fullUrl });
    }
    return tenders;
}

async function main() {
    const today = todayISO();
    console.log(`[eproc] Run started ${new Date().toISOString()}`);

    // Read data.js, extract existing URLs
    if (!fs.existsSync(DATA_FILE)) { console.error('data.js missing'); process.exit(1); }
    const dataContent = fs.readFileSync(DATA_FILE, 'utf8');
    const existingUrls = new Set();
    const urlRe = /url:\s*"([^"]+)"/g;
    let m;
    while ((m = urlRe.exec(dataContent)) !== null) existingUrls.add(m[1].toLowerCase());
    console.log(`[eproc] Existing URLs in data.js: ${existingUrls.size}`);

    // Fetch eProc home + tenders
    const moldovaTenders = [];
    for (const target of EPROC_TENDERS) {
        try {
            console.log(`[eproc] Fetching ${target}`);
            const { url: finalUrl, html } = await fetch(target);
            console.log(`[eproc] Got ${html.length} bytes from ${finalUrl}`);
            const found = findMoldovaTenders(html, finalUrl);
            for (const t of found) {
                if (!moldovaTenders.find(x => x.url === t.url)) moldovaTenders.push(t);
            }
        } catch (err) {
            console.warn(`[eproc] Could not fetch ${target}: ${err.message}`);
        }
    }
    console.log(`[eproc] Moldova-related tenders found: ${moldovaTenders.length}`);

    // Filter out tenders whose URL is already in data.js
    const newOnes = moldovaTenders.filter(t => !existingUrls.has(t.url.toLowerCase()));
    console.log(`[eproc] NEW (not yet in data.js): ${newOnes.length}`);

    // Build new calls
    const newCalls = newOnes.map(t => ({
        id: `auto-coe-${slugify(t.title)}-${today}`,
        title: `[CoE Procurement] ${t.title}`,
        funderId: 'coe',
        type: 'AT',
        opensOn: today,
        deadline: plusDays(30),
        deadlineType: 'expected',
        deadlineNote: 'AUTO-DETECTAT din eproc.coe.int — verifică termenul exact pe pagina sursei',
        audiences: ['ONG', 'Public'],
        topics: ['Justiție', 'Drepturile omului', 'Democrație', 'Guvernare'],
        url: t.url,
        description: `Anunț de procurare al Consiliului Europei vizând Moldova, detectat automat pe ${today}. Necesită revizuire (eligibilitate, deadline real, buget).`,
        budgetTotal: '',
        budgetPerProject: '',
        eligibility: ['AUTO-DETECTAT din eproc.coe.int — verifică criteriile de eligibilitate pe pagina sursei'],
        verified: today,
        verifiedSource: '.github/workflows/scrape-eproc.yml (eproc.coe.int)',
        autoDetected: true
    }));

    // Write report
    const report = [];
    report.push(`# 🏛 eProc CoE — Moldova report — ${today}`);
    report.push('');
    report.push(`**Source:** https://eproc.coe.int/home`);
    report.push(`**Total Moldova mentions:** ${moldovaTenders.length}`);
    report.push(`**Already in catalog:** ${moldovaTenders.length - newCalls.length}`);
    report.push(`**NEW to review:** ${newCalls.length}`);
    report.push('');
    if (newCalls.length > 0) {
        report.push('## Detected new procurement notices targeting Moldova');
        report.push('');
        for (const c of newCalls) {
            report.push(`- **${c.title}**`);
            report.push(`  - ${c.url}`);
        }
        report.push('');
        report.push('All added with `autoDetected: true` + `funderId: "coe"` — hidden from public until reviewed in admin.');
    } else if (moldovaTenders.length === 0) {
        report.push('No Moldova-related tenders visible on eProc CoE today.');
    } else {
        report.push('All Moldova-related tenders already in catalog.');
    }
    fs.writeFileSync(REPORT_FILE, report.join('\n'));

    // Modify data.js: insert new calls + ensure "coe" funder exists
    if (newCalls.length > 0) {
        const fundersStart = dataContent.indexOf('const FUNDERS');
        const callsClose = dataContent.lastIndexOf('];', fundersStart);
        if (callsClose === -1) { console.error('Cannot find CALLS close'); process.exit(1); }

        const indentedJson = newCalls.map(c => '    ' + JSON.stringify(c, null, 4).replace(/\n/g, '\n    ')).join(',\n');
        const insertion = `,\n\n    // ===== eProc CoE auto-detected ${today} =====\n${indentedJson}\n`;

        let newContent = dataContent.slice(0, callsClose) + insertion + dataContent.slice(callsClose);

        // Add "coe" funder if missing
        if (!/^\s+coe:\s*\{/m.test(newContent)) {
            const fundersBlockStart = newContent.indexOf('const FUNDERS = {');
            const insertPos = newContent.indexOf('\n', fundersBlockStart) + 1;
            const coeFunder = `    coe: {
        id: "coe",
        name: "Council of Europe — eProcurement",
        short: "CoE",
        logoColor: "blue",
        origin: "Bilateral",
        originLabel: "Org. internațională · CoE",
        description: "Consiliul Europei publică pe eproc.coe.int anunțuri de procurare/cooperare tehnică. Apelurile vizează implementarea Planului de Acțiune CoE pentru Moldova.",
        website: "https://eproc.coe.int/home"
    },
`;
            newContent = newContent.slice(0, insertPos) + coeFunder + newContent.slice(insertPos);
        }

        fs.writeFileSync(DATA_FILE, newContent);
        console.log(`[eproc] Added ${newCalls.length} entries to data.js`);
    }

    // GitHub Actions outputs
    if (process.env.GITHUB_OUTPUT) {
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `count=${newCalls.length}\n`);
    }

    console.log(`[eproc] Done. count=${newCalls.length}`);
}

main().catch(err => {
    console.error('[eproc] FATAL:', err);
    process.exit(1);
});
