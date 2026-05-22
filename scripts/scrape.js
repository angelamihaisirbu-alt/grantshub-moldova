#!/usr/bin/env node
// GrantsHub Moldova - cross-platform scraper (Node.js, no deps)
// Used by GitHub Actions workflow + can also run locally.
// Detects new calls on civic.md, appends them to data.js as autoDetected: true.

const https = require('https');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'data.js');
const REPORT_FILE = path.join(__dirname, 'last_report.md');

// Sources to scrape. Each has: url, name, anchor regex, link-prefix for absolute URL.
const SOURCES = [
    {
        name: 'civic.md',
        url: 'https://civic.md/anunturi/granturi.html',
        funderId: 'auto',
        anchorRe: /<a[^>]+href="(\/anunturi\/granturi\/[^"#?]+\.html)"[^>]*>\s*([^<]+?)\s*<\/a>/g,
        absolute: rel => `https://civic.md${rel}`,
        keywordFilter: null
    },
    {
        name: 'md.usembassy.gov',
        url: 'https://md.usembassy.gov/education-culture/local-programs/grants/',
        funderId: 'usembassy',
        anchorRe: /<a[^>]+href="(https?:\/\/md\.usembassy\.gov\/[^"#?]+\/?)"[^>]*>\s*([^<]+?)\s*<\/a>/gi,
        absolute: u => u,
        keywordFilter: /grant|funding|program|call|proposal/i
    },
    {
        name: 'gov.uk/british-embassy-chisinau',
        url: 'https://www.gov.uk/world/organisations/british-embassy-chisinau',
        funderId: 'uk-embassy',
        anchorRe: /<a[^>]+href="(\/government\/(news|publications)\/[^"#?]+)"[^>]*>\s*([^<]+?)\s*<\/a>/gi,
        absolute: rel => `https://www.gov.uk${rel}`,
        keywordFilter: /grant|fund|call|moldova/i,
        titleIdx: 3 // titlul e în grupul 3 (există 2 grupuri în URL)
    },
    {
        name: 'chisinau.diplo.de',
        url: 'https://chisinau.diplo.de/md-ro',
        funderId: 'germany-embassy',
        anchorRe: /<a[^>]+href="(https?:\/\/chisinau\.diplo\.de\/[^"#?]+\/?)"[^>]*>\s*([^<]+?)\s*<\/a>/gi,
        absolute: u => u,
        keywordFilter: /grant|finanț|program|cultur|apel/i
    },
    {
        name: 'md.emb-japan.go.jp',
        url: 'https://www.md.emb-japan.go.jp/itpr_en/information.html',
        funderId: 'japan',
        anchorRe: /<a[^>]+href="(https?:\/\/(?:www\.)?md\.emb-japan\.go\.jp\/[^"#?]+\/?)"[^>]*>\s*([^<]+?)\s*<\/a>/gi,
        absolute: u => u,
        keywordFilter: /grant|kusanone|grassroots|program|apel/i
    },
    {
        name: 'moldova.solidarityfund.pl',
        url: 'https://moldova.solidarityfund.pl',
        funderId: 'solidarityfund',
        anchorRe: /<a[^>]+href="(https?:\/\/moldova\.solidarityfund\.pl\/[^"#?]+\/?)"[^>]*>\s*([^<]+?)\s*<\/a>/gi,
        absolute: u => u,
        keywordFilter: /grant|finan[țt]|call|apel|proiect|program|comp[ée]tition/i
    }
];

function fetch(url, redirects = 5) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, {
            headers: { 'User-Agent': 'GrantsHubMoldova/1.0 (+github-actions)' }
        }, res => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects > 0) {
                return fetch(res.headers.location, redirects - 1).then(resolve, reject);
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
            }
            let data = '';
            res.setEncoding('utf8');
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.setTimeout(30000, () => req.destroy(new Error('Request timeout')));
    });
}

function slugify(s) {
    return s.toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50)
        .replace(/-+$/, '');
}

function decodeHtmlEntities(s) {
    const named = {
        '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'",
        '&nbsp;': ' ', '&#039;': "'", '&#39;': "'", '&#34;': '"'
    };
    return s
        .replace(/&[a-z]+;|&#0?39;|&#0?34;/gi, m => named[m.toLowerCase()] || m)
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
        .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

function plusDays(n) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
}

async function main() {
    const today = todayISO();
    console.log(`[scrape] Run started ${new Date().toISOString()}`);

    // Step 1: read existing data.js
    if (!fs.existsSync(DATA_FILE)) {
        console.error('data.js not found');
        process.exit(1);
    }
    const dataContent = fs.readFileSync(DATA_FILE, 'utf8');

    // Extract existing URLs (lowercased) from data.js
    const existingUrls = new Set();
    const urlRe = /url:\s*"([^"]+)"/g;
    let m;
    while ((m = urlRe.exec(dataContent)) !== null) {
        existingUrls.add(m[1].toLowerCase());
    }
    console.log(`[scrape] Existing URLs in data.js: ${existingUrls.size}`);

    // Check whether "auto" funder is already defined
    const hasAutoFunder = /^\s{4}auto:\s*\{/m.test(dataContent);

    // Step 2+3: fetch each source and parse entries
    const newCalls = [];
    const seen = new Set();

    for (const source of SOURCES) {
        console.log(`[scrape] Fetching ${source.name} — ${source.url}`);
        let html;
        try {
            html = await fetch(source.url);
            console.log(`[scrape] ${source.name}: ${html.length} bytes`);
        } catch (err) {
            console.warn(`[scrape] ${source.name} FAILED: ${err.message}`);
            continue;
        }

        const titleIdx = source.titleIdx || 2;
        const re = new RegExp(source.anchorRe.source, source.anchorRe.flags);
        let m;
        let foundInSource = 0;
        while ((m = re.exec(html)) !== null) {
            const relUrl = m[1];
            const title = decodeHtmlEntities(m[titleIdx]).replace(/\s+/g, ' ').trim();
            if (title.length < 12) continue;
            // Skip navigation, pagination, category labels
            if (/^(Granturi|Anun[țt]uri|Acas[ăa]|Mai mult|Vezi tot|Cite[șs]te|Pagina|[ÎI]napoi|Read more|Home|Contact|About|Login|\d+ \w+ \d{4})/i.test(title)) continue;
            if (!/[a-zA-Z]{4,}/i.test(title)) continue;
            // Apply source-specific keyword filter (if any)
            if (source.keywordFilter && !source.keywordFilter.test(title) && !source.keywordFilter.test(relUrl)) continue;

            const fullUrl = source.absolute(relUrl);
            const key = fullUrl.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            if (existingUrls.has(key)) continue;

            newCalls.push({
                id: `auto-${source.funderId}-${slugify(title)}-${today}`,
                title: source.funderId === 'auto' ? title : `[${source.name}] ${title}`,
                funderId: source.funderId,
                type: 'Grant',
                opensOn: today,
                deadline: plusDays(30),
                deadlineType: 'expected',
                deadlineNote: `AUTO-DETECTAT din ${source.name} — verifică deadline-ul real pe pagina sursei`,
                audiences: ['ONG'],
                topics: [],
                url: fullUrl,
                description: `Auto-detectat de pe ${source.name} la ${today}. Necesită revizuire manuală în admin (deadline real, eligibilitate, beneficiari).`,
                budgetTotal: '',
                budgetPerProject: '',
                eligibility: [`AUTO-DETECTAT din ${source.name} — completează criteriile din pagina sursei`],
                verified: today,
                verifiedSource: `.github/workflows/update-grants.yml (${source.name})`,
                autoDetected: true
            });
            foundInSource++;
        }
        console.log(`[scrape] ${source.name}: ${foundInSource} new candidates`);
    }

    console.log(`[scrape] Total candidates from all sources: ${newCalls.length}`);

    // Step 4: write report
    const reportLines = [
        `# 🤖 Auto-update report — ${today}`,
        '',
        `**Source:** civic.md/anunturi/granturi.html`,
        `**Run:** ${new Date().toISOString()}`,
        `**Existing URLs in data.js:** ${existingUrls.size}`,
        `**New candidates detected:** ${newCalls.length}`,
        ''
    ];

    if (newCalls.length === 0) {
        reportLines.push('No new calls to review. Closing.');
        fs.writeFileSync(REPORT_FILE, reportLines.join('\n'));
        console.log('NEW_CALLS=0');
        // Emit GitHub Actions output for downstream steps
        if (process.env.GITHUB_OUTPUT) {
            fs.appendFileSync(process.env.GITHUB_OUTPUT, 'count=0\n');
        }
        return;
    }

    reportLines.push('## Detected calls (filtered out of public view until reviewed)');
    reportLines.push('');
    reportLines.push('Each entry is added to `data.js` with `autoDetected: true` and is hidden from the public catalog.');
    reportLines.push('To make them visible, open `admin.html` → edit each entry → save (the flag is cleared automatically).');
    reportLines.push('');
    for (const c of newCalls) {
        reportLines.push(`### ${c.title}`);
        reportLines.push(`- 🔗 Source: [${c.url}](${c.url})`);
        reportLines.push(`- 📅 Detected: ${today}`);
        reportLines.push(`- 🆔 ID: \`${c.id}\``);
        reportLines.push('');
    }
    reportLines.push('## Review checklist for each entry');
    reportLines.push('');
    reportLines.push('- [ ] Confirm title is a real grant call (not category/index page)');
    reportLines.push('- [ ] Set real deadline + change `deadlineType` from `expected` to `fixed` if date is known');
    reportLines.push('- [ ] Classify real funder (replace `funderId: "auto"` with correct ID)');
    reportLines.push('- [ ] Set correct audiences (ONG / IMM / Public / APL)');
    reportLines.push('- [ ] Pick topics from `TOPICS` map');
    reportLines.push('- [ ] Fill eligibility from source page');
    reportLines.push('- [ ] Add budget fields if known');
    reportLines.push('- [ ] After review, save in admin (clears `autoDetected` flag) → entry becomes public');

    fs.writeFileSync(REPORT_FILE, reportLines.join('\n'));

    // Step 5: modify data.js — insert new entries before the CALLS array close
    const fundersStart = dataContent.indexOf('const FUNDERS');
    if (fundersStart === -1) {
        console.error('[scrape] Cannot find FUNDERS marker in data.js');
        process.exit(1);
    }
    const callsClose = dataContent.lastIndexOf('];', fundersStart);
    if (callsClose === -1) {
        console.error('[scrape] Cannot find CALLS array close before FUNDERS');
        process.exit(1);
    }

    const indentedJson = newCalls.map(c => {
        // Pretty-print each entry with 4-space indent
        return '    ' + JSON.stringify(c, null, 4).replace(/\n/g, '\n    ');
    }).join(',\n');

    const insertion = `,\n\n    // ===== AUTO-DETECTED ${today} =====\n${indentedJson}\n`;

    let newContent = dataContent.slice(0, callsClose) + insertion + dataContent.slice(callsClose);

    // Insert auto funder if missing
    if (!hasAutoFunder) {
        const fundersBlockStart = newContent.indexOf('const FUNDERS = {');
        const insertPos = newContent.indexOf('\n', fundersBlockStart) + 1;
        const autoFunderDef = `    auto: {
        id: "auto",
        name: "Auto-detectat (necesită clasificare)",
        short: "AUTO",
        logoColor: "yellow",
        origin: "Fundatie",
        originLabel: "Sursă: civic.md auto-scraper",
        description: "Apel detectat automat. Clasifică finanțatorul real în admin.",
        website: "https://civic.md"
    },
`;
        newContent = newContent.slice(0, insertPos) + autoFunderDef + newContent.slice(insertPos);
    }

    fs.writeFileSync(DATA_FILE, newContent);
    console.log(`[scrape] data.js updated (+${newCalls.length} entries)`);

    if (process.env.GITHUB_OUTPUT) {
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `count=${newCalls.length}\n`);
        const titles = newCalls.map(c => `- ${c.title}`).join('\n');
        // Use heredoc-style for multiline
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `titles<<EOF\n${titles}\nEOF\n`);
    }

    console.log(`NEW_CALLS=${newCalls.length}`);
}

main().catch(err => {
    console.error('[scrape] FATAL:', err);
    process.exit(1);
});
