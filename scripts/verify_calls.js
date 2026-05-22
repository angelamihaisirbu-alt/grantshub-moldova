#!/usr/bin/env node
// GrantsHub Moldova - Call verifier
// Fetches each call's URL and detects closure signals (404, closure keywords).
// Only flags NEW closures (skips already manuallyClosed: true + recently verified).
// Modifies data.js adding manuallyClosed: true to suspect entries.

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.resolve(__dirname, '..', 'data.js');
const REPORT_FILE = path.resolve(__dirname, 'verify_report.md');

// Closure detection keywords (case-insensitive)
const CLOSURE_KEYWORDS = [
    // Romanian
    'apel încheiat', 'apel inchis', 'apel închis',
    'termen expirat', 'termenul a expirat',
    'aplicare închisă', 'aplicații închise',
    'cererile s-au închis', 's-a încheiat depunerea',
    'depunerea a expirat', 'apelul a fost închis',
    // English
    'no longer accepting', 'application period ended',
    'deadline passed', 'deadline has passed',
    'this call is closed', 'closed for applications',
    'applications closed', 'submission closed',
    'call closed', 'no longer open'
];

// Re-verify after this many days
const RE_VERIFY_DAYS = 14;

function fetch(url, redirects = 5) {
    return new Promise((resolve, reject) => {
        const isHttps = url.startsWith('https://');
        const lib = isHttps ? https : http;
        const req = lib.get(url, {
            headers: {
                'User-Agent': 'GrantsHubMoldova-Verifier/1.0',
                'Accept': 'text/html,application/xhtml+xml'
            }
        }, res => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects > 0) {
                const next = res.headers.location.startsWith('http') ? res.headers.location : new URL(res.headers.location, url).toString();
                return fetch(next, redirects - 1).then(resolve, reject);
            }
            if (res.statusCode >= 400) {
                const err = new Error(`HTTP ${res.statusCode}`);
                err.statusCode = res.statusCode;
                return reject(err);
            }
            let data = '';
            res.setEncoding('utf8');
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.setTimeout(20000, () => req.destroy(new Error('Request timeout')));
    });
}

function parseCalls(content) {
    // Match each call object (top-level inside CALLS array)
    // Extract: id, url, deadlineType, manuallyClosed (if present), verified
    const calls = [];

    // Find CALLS array bounds
    const callsStart = content.indexOf('const CALLS = [');
    const callsEnd = content.indexOf('];', callsStart);
    if (callsStart === -1 || callsEnd === -1) return calls;
    const callsBody = content.slice(callsStart, callsEnd);

    // Simple field extraction per object (multi-line aware)
    // We look for `id: "X"` markers and capture nearby url, deadlineType, manuallyClosed
    const idRegex = /id:\s*"([^"]+)"/g;
    let m;
    while ((m = idRegex.exec(callsBody)) !== null) {
        const id = m[1];
        // Find the surrounding object end (next `},` or `}\n    ];`)
        const objStart = callsBody.lastIndexOf('{', m.index);
        // Find the matching closing brace by counting depth
        let depth = 0;
        let objEnd = -1;
        for (let i = objStart; i < callsBody.length; i++) {
            if (callsBody[i] === '{') depth++;
            else if (callsBody[i] === '}') {
                depth--;
                if (depth === 0) { objEnd = i; break; }
            }
        }
        if (objEnd === -1) continue;
        const objText = callsBody.slice(objStart, objEnd + 1);

        const urlM = /url:\s*"([^"]+)"/.exec(objText);
        const dtM = /deadlineType:\s*"([^"]+)"/.exec(objText);
        const verM = /verified:\s*"([^"]+)"/.exec(objText);
        const mcM = /manuallyClosed:\s*true/.test(objText);
        const adM = /autoDetected:\s*true/.test(objText);

        if (urlM) {
            calls.push({
                id,
                url: urlM[1],
                deadlineType: dtM ? dtM[1] : 'fixed',
                verified: verM ? verM[1] : '',
                manuallyClosed: mcM,
                autoDetected: adM,
                absoluteIndex: callsStart + objEnd + 1
            });
        }
    }
    return calls;
}

function isoToday() { return new Date().toISOString().slice(0, 10); }
function daysSince(isoDate) {
    if (!isoDate) return Infinity;
    const then = new Date(isoDate);
    const now = new Date();
    return Math.floor((now - then) / (24 * 60 * 60 * 1000));
}

async function verifyCall(call) {
    const result = { id: call.id, url: call.url, status: null, reason: null };
    try {
        const html = await fetch(call.url);
        const lower = html.toLowerCase();
        const hits = CLOSURE_KEYWORDS.filter(kw => lower.includes(kw));
        if (hits.length >= 2) {
            result.status = 'CLOSED';
            result.reason = 'keywords match (' + hits.length + '): ' + hits.slice(0, 3).join('; ');
        } else if (hits.length === 1) {
            result.status = 'SUSPECTED';
            result.reason = 'single keyword: ' + hits[0];
        } else {
            result.status = 'OK';
        }
    } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
            result.status = 'NOT_FOUND';
            result.reason = `HTTP ${err.statusCode}`;
        } else {
            result.status = 'ERROR';
            result.reason = err.message;
        }
    }
    return result;
}

function markClosedInData(content, callIds) {
    // For each call id in callIds, add `manuallyClosed: true` to its object if not already present.
    let modified = content;
    for (const id of callIds) {
        // Match: object containing `id: "X"` and ending with `}` followed by `,` or whitespace + `]`
        // Insert before the closing brace
        const idMarker = `id: "${id}"`;
        const idIdx = modified.indexOf(idMarker);
        if (idIdx === -1) continue;
        // Find object boundaries
        const objStart = modified.lastIndexOf('{', idIdx);
        let depth = 0;
        let objEnd = -1;
        for (let i = objStart; i < modified.length; i++) {
            if (modified[i] === '{') depth++;
            else if (modified[i] === '}') {
                depth--;
                if (depth === 0) { objEnd = i; break; }
            }
        }
        if (objEnd === -1) continue;
        const obj = modified.slice(objStart, objEnd + 1);
        if (/manuallyClosed:\s*true/.test(obj)) continue; // already marked

        // Find the line indent of the last property
        const beforeBrace = modified.slice(0, objEnd);
        const lastNewline = beforeBrace.lastIndexOf('\n');
        const indent = beforeBrace.slice(lastNewline + 1).match(/^(\s*)/)[1];
        // We want the property indent (one less than closing brace's indent? actually same as other props)
        // Look at any existing property indent inside obj
        const propIndentMatch = obj.match(/\n(\s+)\w+:/);
        const propIndent = propIndentMatch ? propIndentMatch[1] : indent + '    ';

        // Trim trailing whitespace before closing brace and add comma if needed
        let before = modified.slice(0, objEnd);
        const stripped = before.replace(/\s+$/, '');
        const needsComma = !stripped.endsWith(',') && !stripped.endsWith('{');
        const insertion = (needsComma ? ',' : '') + '\n' + propIndent + 'manuallyClosed: true,\n' + propIndent + 'closedDetectedOn: "' + isoToday() + '"\n' + indent;
        modified = stripped + insertion + modified.slice(objEnd);
    }
    return modified;
}

async function main() {
    const today = isoToday();
    console.log(`[verify] Run started ${new Date().toISOString()}`);

    const content = fs.readFileSync(DATA_FILE, 'utf8');
    const calls = parseCalls(content);
    console.log(`[verify] Parsed ${calls.length} calls from data.js`);

    // Skip rules: already manuallyClosed, expected calls, recently verified
    const toCheck = calls.filter(c => {
        if (c.manuallyClosed) return false;
        if (c.deadlineType === 'expected') return false;
        // Skip if recently re-verified (less than RE_VERIFY_DAYS ago)
        if (c.verified && daysSince(c.verified) < RE_VERIFY_DAYS) return false;
        return true;
    });
    console.log(`[verify] ${toCheck.length} calls to verify (rest skipped: manuallyClosed/expected/recent)`);

    const results = [];
    for (const call of toCheck) {
        process.stdout.write(`[verify] checking ${call.id}... `);
        const result = await verifyCall(call);
        process.stdout.write(result.status + (result.reason ? ' (' + result.reason + ')' : '') + '\n');
        results.push(result);
        // Be polite to servers
        await new Promise(r => setTimeout(r, 500));
    }

    const newClosures = results.filter(r => r.status === 'CLOSED' || r.status === 'NOT_FOUND');
    const suspected = results.filter(r => r.status === 'SUSPECTED');
    const errors = results.filter(r => r.status === 'ERROR');
    const ok = results.filter(r => r.status === 'OK');

    // Build report
    const report = [];
    report.push(`# 🔍 Verify report — ${today}`);
    report.push('');
    report.push(`**Total calls in data.js:** ${calls.length}`);
    report.push(`**Skipped:** ${calls.length - toCheck.length} (already-closed / expected / recently verified within ${RE_VERIFY_DAYS} days)`);
    report.push(`**Verified this run:** ${toCheck.length}`);
    report.push(`  - ✅ OK: ${ok.length}`);
    report.push(`  - 🚫 Newly closed: ${newClosures.length}`);
    report.push(`  - ⚠ Suspected (1 keyword): ${suspected.length}`);
    report.push(`  - ❌ Errors: ${errors.length}`);
    report.push('');

    if (newClosures.length > 0) {
        report.push('## 🚫 Calls flagged as CLOSED (auto-marked `manuallyClosed: true`)');
        report.push('');
        for (const r of newClosures) {
            report.push(`- **${r.id}**`);
            report.push(`  - URL: ${r.url}`);
            report.push(`  - Reason: ${r.reason}`);
        }
        report.push('');
        report.push('These have been added with `manuallyClosed: true` in `data.js` and will no longer show on the public site after merge.');
        report.push('');
    }

    if (suspected.length > 0) {
        report.push('## ⚠ Suspected (single keyword — needs manual review)');
        report.push('');
        for (const r of suspected) {
            report.push(`- **${r.id}** — ${r.url}`);
            report.push(`  - ${r.reason}`);
        }
        report.push('');
    }

    if (errors.length > 0) {
        report.push('## ❌ Errors (could not verify)');
        report.push('');
        for (const r of errors) {
            report.push(`- **${r.id}** — ${r.url}`);
            report.push(`  - ${r.reason}`);
        }
        report.push('');
    }

    if (newClosures.length === 0 && suspected.length === 0) {
        report.push('## ✓ All checked calls still active.');
    }

    fs.writeFileSync(REPORT_FILE, report.join('\n'));
    console.log(`[verify] Report written: ${REPORT_FILE}`);

    // Modify data.js: mark NEW closures (404/CLOSED) as manuallyClosed: true
    if (newClosures.length > 0) {
        const newContent = markClosedInData(content, newClosures.map(c => c.id));
        fs.writeFileSync(DATA_FILE, newContent);
        console.log(`[verify] Marked ${newClosures.length} entries with manuallyClosed: true`);
    }

    // GitHub Actions output
    if (process.env.GITHUB_OUTPUT) {
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `closures=${newClosures.length}\n`);
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `suspected=${suspected.length}\n`);
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `errors=${errors.length}\n`);
    }

    console.log(`[verify] Done. NEW closures=${newClosures.length}, suspected=${suspected.length}, errors=${errors.length}`);
}

main().catch(err => {
    console.error('[verify] FATAL:', err);
    process.exit(1);
});
