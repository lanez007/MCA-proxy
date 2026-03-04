const https = require("https");
const http = require("http");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const PORT = process.env.PORT || 3000;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const POSTGRES_URL = process.env.POSTGRES_URL;
if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET environment variable is not set. Refusing to start.");
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;
const HERE_API_KEY   = process.env.HERE_API_KEY   || null;
const HUNTER_API_KEY = process.env.HUNTER_API_KEY || null;
const PDL_API_KEY    = process.env.PDL_API_KEY    || null;

// SBA dataset page — we fetch this to find the current CSV download link
// so we never break when SBA publishes a new quarterly file
const SBA_DATASET_PAGE = "https://data.sba.gov/dataset/0ff8e8e9-b967-4f4e-987c-6ac78c575087";

// MCA-relevant NAICS prefixes — skip agriculture, mining, manufacturing, government
// This cuts ~40% of records and keeps RAM under Railway's 512MB limit
const MCA_NAICS_PREFIXES = ["23","44","45","48","49","52","53","54","56","61","62","71","72","81"];

const PLAN_LIMITS = {
  pro: 1000,
  agency: 2000,
  unlimited: Infinity,
  admin: Infinity,
};

// ─── SBA IN-MEMORY CACHE ────────────────────────────────────────
let sbaIndex = null;
let sbaLoading = false;
let sbaLoadError = null;

function normalizeName(name) {
  // Only strip legal entity suffixes — NOT meaningful business words
  // "Smith Consulting" should stay "smith consulting" not "smith"
  return name.toLowerCase()
    .replace(/\b(llc|inc|corp|co\.?|ltd|dba|the|and|&|lp|llp|pllc|pa|na|nv)\b/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; }
    else { current += ch; }
  }
  result.push(current.trim());
  return result;
}

// ─── STATE EXTRACTION ───────────────────────────────────────────
// Robust: handles "FL 33101", "Florida 33101", "United States", HERE format, etc.
const US_STATE_CODES = new Set(['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO',
  'MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC']);
const US_STATE_NAMES = {
  'alabama':'AL','alaska':'AK','arizona':'AZ','arkansas':'AR','california':'CA',
  'colorado':'CO','connecticut':'CT','delaware':'DE','florida':'FL','georgia':'GA',
  'hawaii':'HI','idaho':'ID','illinois':'IL','indiana':'IN','iowa':'IA',
  'kansas':'KS','kentucky':'KY','louisiana':'LA','maine':'ME','maryland':'MD',
  'massachusetts':'MA','michigan':'MI','minnesota':'MN','mississippi':'MS',
  'missouri':'MO','montana':'MT','nebraska':'NE','nevada':'NV','new hampshire':'NH',
  'new jersey':'NJ','new mexico':'NM','new york':'NY','north carolina':'NC',
  'north dakota':'ND','ohio':'OH','oklahoma':'OK','oregon':'OR','pennsylvania':'PA',
  'rhode island':'RI','south carolina':'SC','south dakota':'SD','tennessee':'TN',
  'texas':'TX','utah':'UT','vermont':'VT','virginia':'VA','washington':'WA',
  'west virginia':'WV','wisconsin':'WI','wyoming':'WY','district of columbia':'DC'
};

function extractStateFromAddress(address) {
  if (!address) return '';
  const parts = address.split(',').map(p => p.trim());
  // Check each comma-part for a 2-letter state code (possibly followed by zip: "FL 33101")
  for (const part of parts) {
    const code = part.split(/\s+/)[0].toUpperCase();
    if (US_STATE_CODES.has(code)) return code;
  }
  // Check for full state name (HERE uses "Florida", "Texas", etc.)
  // Sort by name length descending so "west virginia" matches before "virginia"
  const lower = address.toLowerCase();
  const sortedNames = Object.entries(US_STATE_NAMES).sort((a,b) => b[0].length - a[0].length);
  for (const [name, code] of sortedNames) {
    const re = new RegExp('\\b' + name + '\\b');
    if (re.test(lower)) return code;
  }
  return '';
}

// Use the CKAN JSON API to find the current CSV download URL
// This is far more reliable than HTML scraping — it's a stable machine-readable API
// Falls back to a known URL if the API is unavailable
const SBA_DATASET_ID  = "0ff8e8e9-b967-4f4e-987c-6ac78c575087";
const SBA_FALLBACK_URL = "https://data.sba.gov/dataset/0ff8e8e9-b967-4f4e-987c-6ac78c575087/resource/d67d3ccb-2002-4134-a288-481b51cd3479/download/foia-7a-fy2020-present-as-of-251231.csv";

async function getSBADownloadUrl() {
  try {
    const apiUrl = `https://data.sba.gov/api/3/action/package_show?id=${SBA_DATASET_ID}`;
    const raw = await new Promise((resolve, reject) => {
      https.get(apiUrl, { headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" } }, (res) => {
        let data = "";
        res.on("data", c => { data += c; if (data.length > 500000) res.destroy(); });
        res.on("end", () => resolve(data));
        res.on("error", reject);
      }).on("error", reject).setTimeout(10000, function() { this.destroy(); reject(new Error("CKAN API timeout")); });
    });
    const json = JSON.parse(raw);
    if (!json.success) throw new Error("CKAN API returned success=false");
    const resources = json.result?.resources || [];
    // Find resources that are CSVs for the 7(a) "present" (most recent) file
    const csvResources = resources.filter(r =>
      r.format === "CSV" &&
      r.url &&
      r.url.includes("foia-7a") &&
      (r.url.toLowerCase().includes("present") || (r.name || "").toLowerCase().includes("present"))
    );
    if (csvResources.length === 0) throw new Error("No 7(a) present CSV found in CKAN resources");
    // Sort by URL descending — date suffix in filename means highest = most recent
    csvResources.sort((a, b) => b.url.localeCompare(a.url));
    console.log(`📋 CKAN API found ${csvResources.length} present CSV(s), using: ${csvResources[0].url}`);
    return csvResources[0].url;
  } catch(e) {
    console.log("⚠️  CKAN API failed:", e.message, "— using fallback URL");
    return SBA_FALLBACK_URL;
  }
}

// Follow redirects for a plain https/http get, up to 5 hops
function getFollowRedirects(url, options, callback, hops) {
  if ((hops || 0) > 5) { callback(new Error("Too many redirects")); return; }
  const proto = url.startsWith("https") ? https : http;
  const req = proto.get(url, options, (res) => {
    if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
      res.resume();
      const next = res.headers.location.startsWith("http") ? res.headers.location
        : new URL(res.headers.location, url).href;
      getFollowRedirects(next, options, callback, (hops||0)+1);
      return;
    }
    callback(null, res);
  });
  req.setTimeout(300000, () => { req.destroy(); callback(new Error("timeout")); });
  req.on("error", callback);
}

async function loadSBAData() {
  if (sbaIndex || sbaLoading) return;
  sbaLoading = true;
  sbaLoadError = null;
  console.log("📊 SBA load starting — fetching current CSV URL...");
  try {
    const csvUrl = await getSBADownloadUrl();
    console.log("📊 Streaming SBA CSV:", csvUrl);

    await new Promise((resolve, reject) => {
      getFollowRedirects(csvUrl, { headers: { "User-Agent": "Mozilla/5.0" } }, (err, res) => {
        if (err) return reject(err);
        if (res.statusCode !== 200) return reject(new Error(`SBA CSV returned HTTP ${res.statusCode}`));

        const index = {};
        let count = 0, skipped = 0;
        let headerParsed = false;
        let idx = {};
        let leftover = "";

        res.on("data", chunk => {
          const text = leftover + chunk.toString();
          const lines = text.split("\n");
          leftover = lines.pop();
          for (const line of lines) {
            if (!line.trim()) continue;
            if (!headerParsed) {
              const headers = parseCSVLine(line).map(h => h.replace(/"/g, "").trim());
              idx = {
                name:   headers.findIndex(h => /BorrowerName/i.test(h)),
                city:   headers.findIndex(h => /BorrowerCity/i.test(h)),
                state:  headers.findIndex(h => /BorrowerState/i.test(h)),
                naics:  headers.findIndex(h => /NaicsCode/i.test(h)),
                amount: headers.findIndex(h => /GrossApproval/i.test(h)),
                date:   headers.findIndex(h => /ApprovalDate/i.test(h)),
                lender: headers.findIndex(h => /BankName/i.test(h)),
                jobs:   headers.findIndex(h => /JobsSupported/i.test(h)),
              };
              headerParsed = true;
              if (idx.name < 0) { reject(new Error("CSV header parse failed — name col not found")); return; }
              console.log(`📊 SBA CSV headers parsed. Columns: name=${idx.name} state=${idx.state} amount=${idx.amount} naics=${idx.naics}`);
              continue;
            }
            const cols = parseCSVLine(line);
            const name = (cols[idx.name] || "").replace(/"/g, "").trim();
            if (!name) continue;

            // Filter: only MCA-relevant NAICS codes — cuts ~40% of records, saves RAM
            const naics = (cols[idx.naics] || "").replace(/"/g, "").trim();
            if (naics && !MCA_NAICS_PREFIXES.some(p => naics.startsWith(p))) {
              skipped++; continue;
            }

            // Filter: skip tiny loans (not useful as revenue signal)
            const amount = parseFloat((cols[idx.amount] || "0").replace(/[^0-9.]/g, "")) || 0;
            if (amount < 25000) { skipped++; continue; }

            const key = normalizeName(name);
            if (!key || key.length < 3) continue;
            const record = {
              name,
              city:   (cols[idx.city]   || "").replace(/"/g, "").trim(),
              state:  (cols[idx.state]  || "").replace(/"/g, "").trim().toUpperCase(),
              naics,
              amount,
              date:   (cols[idx.date]   || "").replace(/"/g, "").trim(),
              lender: (cols[idx.lender] || "").replace(/"/g, "").trim(),
              jobs:   parseInt((cols[idx.jobs] || "0").replace(/[^0-9]/g, "")) || 0,
              estMonthlyRevenue: Math.round((amount * 8) / 12),
            };
            if (!index[key]) index[key] = [];
            index[key].push(record);
            count++;
            if (count % 50000 === 0) console.log(`📊 SBA indexed ${count} records so far...`);
          }
        });

        res.on("end", () => {
          // Process any remaining data in leftover (last line if no trailing newline)
          if (leftover.trim()) {
            const cols = parseCSVLine(leftover);
            const name = (cols[idx.name] || "").replace(/"/g, "").trim();
            if (name) {
              const naics = (cols[idx.naics] || "").replace(/"/g, "").trim();
              const amount = parseFloat((cols[idx.amount] || "0").replace(/[^0-9.]/g, "")) || 0;
              if (amount >= 25000 && (!naics || MCA_NAICS_PREFIXES.some(p => naics.startsWith(p)))) {
                const key = normalizeName(name);
                if (key && key.length >= 3) {
                  const record = {
                    name,
                    city:   (cols[idx.city]   || "").replace(/"/g, "").trim(),
                    state:  (cols[idx.state]  || "").replace(/"/g, "").trim().toUpperCase(),
                    naics,
                    amount,
                    date:   (cols[idx.date]   || "").replace(/"/g, "").trim(),
                    lender: (cols[idx.lender] || "").replace(/"/g, "").trim(),
                    jobs:   parseInt((cols[idx.jobs] || "0").replace(/[^0-9]/g, "")) || 0,
                    estMonthlyRevenue: Math.round((amount * 8) / 12),
                  };
                  if (!index[key]) index[key] = [];
                  index[key].push(record);
                  count++;
                }
              }
            }
          }
          if (count === 0) { reject(new Error("SBA CSV parsed but 0 records indexed — possible format change")); return; }
          sbaIndex = index;
          sbaLoading = false;
          console.log(`✅ SBA loaded — ${count} records indexed, ${skipped} skipped (non-MCA NAICS or tiny loans)`);
          resolve();
        });
        res.on("error", reject);
      });
    });
  } catch(err) {
    sbaLoadError = err.message;
    sbaLoading = false;
    console.error("❌ SBA load failed:", err.message, "— will retry in 60s");
    setTimeout(loadSBAData, 60000);
  }
}

function lookupSBA(businessName, state) {
  if (!sbaIndex) return null;
  const key = normalizeName(businessName);
  if (!key || key.length < 3) return null;

  // Tier 1: exact normalized match
  let matches = sbaIndex[key] || [];

  // Tier 2: prefix match — one key starts with the other (handles Inc/LLC differences)
  // Only do this if key is at least 6 chars to avoid matching "home" → "home depot"
  if (matches.length === 0 && key.length >= 6) {
    for (const [k, records] of Object.entries(sbaIndex)) {
      if (k.startsWith(key) || key.startsWith(k)) {
        matches = [...matches, ...records];
        if (matches.length >= 10) break;
      }
    }
  }

  // Tier 3: scored word overlap — TIGHTER rules to avoid false positives
  // Require ALL significant words (>3 chars) to match, not just 50%
  // Also require at least 2 significant words — single-word matches are too loose
  if (matches.length === 0) {
    const words = key.split(" ").filter(w => w.length > 3);
    if (words.length >= 2) {
      // Only search if state is known — narrows the universe dramatically
      const scored = [];
      for (const [k, records] of Object.entries(sbaIndex)) {
        // Must have state match if we know the state
        if (state && !records.some(r => r.state === state)) continue;
        const matchCount = words.filter(w => k.includes(w)).length;
        // All significant words must match (not 50%) — strict
        if (matchCount === words.length) {
          scored.push({ score: matchCount, records });
        }
      }
      scored.sort((a, b) => b.score - a.score);
      for (const { records } of scored.slice(0, 3)) {
        matches = [...matches, ...records];
      }
    }
  }

  if (matches.length === 0) return null;

  // Prefer state match, then highest loan amount
  const stateMatches = state ? matches.filter(r => r.state === state) : matches;
  const pool = stateMatches.length > 0 ? stateMatches : matches;
  return pool.sort((a, b) => b.amount - a.amount)[0];
}

// ─── POSTGRES ────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
});

function generateReferralCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function initDB() {
  // Email cache + Owner cache — shared across all users, grows over time
  await pool.query(`
    CREATE TABLE IF NOT EXISTS owner_cache (
      biz_key TEXT PRIMARY KEY,
      officer_name TEXT,
      officer_type TEXT,
      incorporation_date TEXT,
      company_status TEXT,
      state TEXT,
      found_at TIMESTAMP DEFAULT NOW(),
      hit_count INTEGER DEFAULT 1
    )
  `).catch(()=>{});

  // Email cache — shared across all users, grows over time
  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_cache (
      domain TEXT PRIMARY KEY,
      email TEXT,
      source TEXT,
      found_at TIMESTAMP DEFAULT NOW(),
      hit_count INTEGER DEFAULT 1
    )
  `).catch(()=>{});

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      plan TEXT NOT NULL DEFAULT 'pro',
      searches_used INTEGER NOT NULL DEFAULT 0,
      searches_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
      is_admin BOOLEAN NOT NULL DEFAULT FALSE,
      is_frozen BOOLEAN NOT NULL DEFAULT FALSE,
      referral_code TEXT UNIQUE,
      referred_by TEXT,
      plan_start_date DATE DEFAULT CURRENT_DATE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  // Add columns if upgrading existing DB
  const alterCols = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN NOT NULL DEFAULT FALSE",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_start_date DATE DEFAULT CURRENT_DATE",
  ];
  for (const q of alterCols) {
    try { await pool.query(q); } catch(_) {}
  }
  // Backfill missing referral codes
  const missing = await pool.query("SELECT id FROM users WHERE referral_code IS NULL");
  for (const row of missing.rows) {
    let code, attempts = 0;
    do {
      code = generateReferralCode();
      attempts++;
    } while (attempts < 10 && (await pool.query("SELECT id FROM users WHERE referral_code = $1", [code])).rows.length > 0);
    await pool.query("UPDATE users SET referral_code = $1 WHERE id = $2", [code, row.id]);
  }
  console.log("DB initialized");
}

initDB().catch(console.error);
loadSBAData(); // background load on startup

async function getUser(userId) {
  const res = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
  const user = res.rows[0];
  if (!user) return null;
  const resetDate = new Date(user.searches_reset_date);
  const now = new Date();
  if (now.getFullYear() > resetDate.getFullYear() || now.getMonth() > resetDate.getMonth()) {
    await pool.query("UPDATE users SET searches_used = 0, searches_reset_date = CURRENT_DATE WHERE id = $1", [userId]);
    user.searches_used = 0;
  }
  return user;
}

function getBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", c => data += c);
    req.on("end", () => { try { resolve(JSON.parse(data)); } catch(e) { resolve({}); } });
    req.on("error", reject);
  });
}

function respond(res, code, obj) {
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": (process.env.ALLOWED_ORIGIN || "*"),
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(JSON.stringify(obj));
}

function verifyToken(req) {
  const auth = req.headers["authorization"] || "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET); }
  catch(e) { return null; }
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(200, {
      "Access-Control-Allow-Origin": (process.env.ALLOWED_ORIGIN || "*"),
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === "/" || url.pathname === "/warmup") {
    loadSBAData(); // trigger load if not already started
    respond(res, 200, { status: "ok", service: "RCN Lead Gen API", sba_ready: !!sbaIndex, sba_loading: sbaLoading, sba_error: sbaLoadError || null, sba_count: sbaIndex ? Object.keys(sbaIndex).length : 0 });
    return;
  }

  // REGISTER
  if (url.pathname === "/auth/register" && req.method === "POST") {
    const { email, password, referredBy } = await getBody(req);
    if (!email || !password) { respond(res, 400, { error: "Email and password required" }); return; }
    if (password.length < 8) { respond(res, 400, { error: "Password must be at least 8 characters" }); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { respond(res, 400, { error: "Invalid email address" }); return; }
    try {
      const hash = await bcrypt.hash(password, 12);
      // Generate unique referral code
      let refCode, attempts = 0;
      do {
        refCode = generateReferralCode();
        attempts++;
      } while (attempts < 10 && (await pool.query("SELECT id FROM users WHERE referral_code = $1", [refCode])).rows.length > 0);
      // Validate referredBy code if provided
      const refBy = (referredBy || "").trim().toUpperCase() || null;
      if (refBy) {
        const refCheck = await pool.query("SELECT id FROM users WHERE referral_code = $1", [refBy]);
        if (refCheck.rows.length === 0) { respond(res, 400, { error: "Invalid referral code" }); return; }
      }
      const result = await pool.query(
        "INSERT INTO users (email, password_hash, plan, referral_code, referred_by) VALUES ($1, $2, 'pro', $3, $4) RETURNING id, email, plan, searches_used, referral_code, name, is_admin",
        [email.toLowerCase().trim(), hash, refCode, refBy]
      );
      const user = result.rows[0];
      const limit = PLAN_LIMITS[user.plan];
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
      respond(res, 201, { token, user: { id: user.id, email: user.email, name: user.name, plan: user.plan, searches_used: 0, searches_remaining: limit, limit, referral_code: user.referral_code, is_admin: user.is_admin } });
    } catch(e) {
      if (e.code === "23505") { respond(res, 409, { error: "An account with this email already exists" }); }
      else { console.error(e); respond(res, 500, { error: "Registration failed" }); }
    }
    return;
  }

  // LOGIN
  if (url.pathname === "/auth/login" && req.method === "POST") {
    const { email, password, referredBy } = await getBody(req);
    if (!email || !password) { respond(res, 400, { error: "Email and password required" }); return; }
    try {
      const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
      const bfCheck = checkBruteForce(email, clientIp);
      if (bfCheck.blocked) { respond(res, 429, { error: bfCheck.message }); return; }
      const result = await pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase().trim()]);
      const user = result.rows[0];
      if (!user) { recordFailedLogin(email, clientIp); respond(res, 401, { error: "Invalid email or password" }); return; }
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) { recordFailedLogin(email, clientIp); respond(res, 401, { error: "Invalid email or password" }); return; }
      clearLoginAttempts(email, clientIp);
      const resetDate = new Date(user.searches_reset_date);
      const now = new Date();
      if (now.getFullYear() > resetDate.getFullYear() || now.getMonth() > resetDate.getMonth()) {
        await pool.query("UPDATE users SET searches_used = 0, searches_reset_date = CURRENT_DATE WHERE id = $1", [user.id]);
        user.searches_used = 0;
      }
      const limit = PLAN_LIMITS[user.plan];
      if (user.is_frozen) { respond(res, 403, { error: "Your account has been suspended. Contact support@thercngroup.com for assistance." }); return; }
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
      respond(res, 200, {
        token,
        user: { id: user.id, email: user.email, name: user.name, plan: user.plan, searches_used: user.searches_used,
          searches_remaining: limit === Infinity ? null : limit - user.searches_used,
          limit: limit === Infinity ? null : limit, referral_code: user.referral_code,
          plan_start_date: user.plan_start_date, created_at: user.created_at, is_admin: user.is_admin }
      });
    } catch(e) { console.error(e); respond(res, 500, { error: "Login failed" }); }
    return;
  }

  // ME
  if (url.pathname === "/auth/me" && req.method === "GET") {
    const decoded = verifyToken(req);
    if (!decoded) { respond(res, 401, { error: "Unauthorized" }); return; }
    try {
      const user = await getUser(decoded.userId);
      if (!user) { respond(res, 404, { error: "User not found" }); return; }
      const limit = PLAN_LIMITS[user.plan];
      // Count referrals
      const refCount = await pool.query("SELECT COUNT(*) FROM users WHERE referred_by = $1", [user.referral_code]);
      respond(res, 200, { user: { id: user.id, email: user.email, name: user.name, plan: user.plan,
        searches_used: user.searches_used,
        searches_remaining: limit === Infinity ? null : limit - user.searches_used,
        limit: limit === Infinity ? null : limit,
        referral_code: user.referral_code, referred_by: user.referred_by,
        referral_count: parseInt(refCount.rows[0].count),
        plan_start_date: user.plan_start_date, created_at: user.created_at,
        is_admin: user.is_admin, is_frozen: user.is_frozen } });
    } catch(e) { console.error(e); respond(res, 500, { error: "Failed to get user" }); }
    return;
  }

  // SEARCH
  if (url.pathname === "/search") {
    const decoded = verifyToken(req);
    if (!decoded) { respond(res, 401, { error: "Unauthorized — please log in" }); return; }
    const type     = (url.searchParams.get("type") || "").substring(0, 200);
    const location = (url.searchParams.get("location") || "").substring(0, 200);
    const limit    = Math.min(parseInt(url.searchParams.get("limit") || "10"), 60);
    if (!type || !location) { respond(res, 400, { error: "type and location required" }); return; }
    try {
      const user = await getUser(decoded.userId);
      if (!user) { respond(res, 401, { error: "User not found" }); return; }
      const planLimit = PLAN_LIMITS[user.plan];
      if (planLimit !== Infinity && user.searches_used + limit > planLimit) {
        const remaining = planLimit - user.searches_used;
        respond(res, 403, { error: `You only have ${remaining} searches left this month.`, searches_used: user.searches_used, searches_remaining: remaining, limit: planLimit, plan: user.plan });
        return;
      }
      const geoData = await googleGet(`/maps/api/geocode/json?address=${enc(location)}&key=${GOOGLE_API_KEY}`);
      if (!geoData.results?.[0]) { respond(res, 404, { error: "Location not found" }); return; }
      const { lat, lng } = geoData.results[0].geometry.location;

      // Fetch Google Places (up to 3 pages) + HERE in parallel
      let allPlaces = [];
      let pageToken = null;
      const googlePagesPromise = (async () => {
        for (let page = 0; page < 3 && allPlaces.length < limit; page++) {
          const pageParam = pageToken ? `&pagetoken=${pageToken}` : '';
          if (page > 0) await new Promise(r => setTimeout(r, 2200));
          const placesData = await googleGet(`/maps/api/place/textsearch/json?query=${enc(type)}&location=${lat},${lng}&radius=50000&key=${GOOGLE_API_KEY}${pageParam}`);
          const results = (placesData.results || []).filter(p => {
            const addr = (p.formatted_address || '').toUpperCase();
            return addr.includes(', USA') || addr.endsWith(' USA');
          });
          allPlaces = allPlaces.concat(results);
          pageToken = placesData.next_page_token || null;
          if (!pageToken) break;
        }
      })();
      const herePromise = hereSearch(type, lat, lng, limit);
      await googlePagesPromise;
      const hereResults = await herePromise;

      // Merge Google + HERE, dedup by placeId first, then normalized name
      const seenIds = new Set();
      const seenNames = new Set();
      const merged = [];
      for (const p of allPlaces) {
        const idKey = p.place_id || '';
        const nameKey = (p.name || '').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 25);
        if (!nameKey) continue;
        if (idKey && seenIds.has(idKey)) continue;
        if (seenNames.has(nameKey)) continue;
        if (idKey) seenIds.add(idKey);
        seenNames.add(nameKey);
        merged.push({...p, _source: 'google'});
      }
      for (const h of hereResults) {
        const idKey = h.placeId || '';
        const nameKey = (h.businessName || '').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 25);
        if (!nameKey) continue;
        if (idKey && seenIds.has(idKey)) continue;
        if (seenNames.has(nameKey)) continue;
        if (idKey) seenIds.add(idKey);
        seenNames.add(nameKey);
        merged.push({...h, _source: 'here'});
      }

      const places = merged.slice(0, limit * 3); // give Details API more to work with
      const actualCount = Math.min(merged.length, limit);

      // Batch Details — Google needs Places API call, HERE already has phone/website
      const detailedRaw = [];
      const googlePlaces = places.filter(p => p._source === 'google');
      const herePlaces   = places.filter(p => p._source === 'here');

      // HERE leads already have details — normalize directly
      for (const h of herePlaces) {
        detailedRaw.push({ businessName: h.businessName, address: h.address, phone: h.phone, website: h.website, placeId: h.placeId, rating: h.rating, reviewCount: h.reviewCount, source: 'here' });
      }

      // Google leads need Details API call — batch in groups of 5
      for (let i = 0; i < googlePlaces.length; i += 5) {
        const batch = googlePlaces.slice(i, i + 5);
        const batchResults = await Promise.all(batch.map(async (p) => {
          try {
            const d = await googleGet(`/maps/api/place/details/json?place_id=${p.place_id}&fields=formatted_phone_number,website,formatted_address,opening_hours,business_status,user_ratings_total&key=${GOOGLE_API_KEY}`);
            return { businessName: p.name, address: d.result?.formatted_address || p.formatted_address || "", phone: d.result?.formatted_phone_number || null, website: d.result?.website || null, placeId: p.place_id, rating: p.rating || null, reviewCount: p.user_ratings_total || 0, source: 'google' };
          } catch(_) {
            return { businessName: p.name, address: p.formatted_address || "", phone: null, website: null, placeId: p.place_id, rating: p.rating || null, reviewCount: p.user_ratings_total || 0, source: 'google' };
          }
        }));
        detailedRaw.push(...batchResults);
        if (i + 5 < googlePlaces.length) await new Promise(r => setTimeout(r, 200));
      }
      const detailed = detailedRaw.slice(0, limit);

      // Auto-SOS: run owner lookup in parallel for all leads with supported states
      // Extract state from address — e.g. "123 Main St, Miami, FL 33101" → "FL"
      const sosSupported = new Set(['FL','TX','GA','NY','CA','IL','AZ','CO','OH','PA','NC','NJ','VA','WA']);
      await Promise.all(detailed.map(async (lead) => {
        try {
          const stateCode = extractStateFromAddress(lead.address || '');
          if (!stateCode || !sosSupported.has(stateCode)) return;
          // Check owner cache first (instant), fall back to live SOS scrape
          const cachedSOS = await getCachedOwner(lead.businessName, stateCode);
          let sosData = cachedSOS || await Promise.race([
            scrapeSOS(lead.businessName, stateCode),
            new Promise(r => setTimeout(() => r(null), 4000))
          ]);
          // If SOS found no owner OR only a commercial registered agent,
          // try Manta/BBB as fallback to get the real owner name
          if (!sosData?.officerName || sosData?.officerType === 'agent') {
            const addrParts = (lead.address || '').split(',');
            const city = addrParts.length >= 3 ? addrParts[addrParts.length - 3]?.trim() : addrParts[0]?.trim() || '';
            const dirResult = await scrapeOwnerFromDirectories(lead.businessName, city, stateCode).catch(()=>null);
            if (dirResult?.officerName) {
              sosData = { ...(sosData || {}), officerName: dirResult.officerName, officerType: 'owner' };
            }
          }
          // Store new finds in cache for next time
          if (sosData?.officerName && !cachedSOS) {
            cacheOwner(lead.businessName, stateCode, sosData).catch(()=>{});
          }
          if (sosData) {
            lead.officerName      = sosData.officerName || null;
            lead.officerType      = sosData.officerType || null;
            lead.incorporationDate = sosData.incorporationDate || null;
            lead.businessAge      = sosData.businessAge || null;
            lead.companyStatus    = sosData.companyStatus || null;
          }
        } catch(_) {}
      }));

      await pool.query("UPDATE users SET searches_used = searches_used + $1 WHERE id = $2", [actualCount, user.id]);
      const newUsed = user.searches_used + actualCount;
      respond(res, 200, { results: detailed, searches_used: newUsed, searches_remaining: planLimit === Infinity ? null : planLimit - newUsed, limit: planLimit === Infinity ? null : planLimit });
    } catch(err) { console.error(err); respond(res, 500, { error: err.message }); }
    return;
  }

  // ENRICH — phone + website + email scrape (homepage & /contact in parallel) + SOS URL
  if (url.pathname === "/enrich") {
    const decoded = verifyToken(req);
    if (!decoded) { respond(res, 401, { error: "Unauthorized" }); return; }
    const placeId      = url.searchParams.get("placeId");
    const websiteHint  = url.searchParams.get("website") || "";
    const bizName      = url.searchParams.get("name") || "";
    const bizState     = url.searchParams.get("state") || "";
    const officerParam = url.searchParams.get("officerName") || "";
    if (!placeId) { respond(res, 400, { error: "placeId required" }); return; }
    try {
      console.log(`[ENRICH] "${bizName}" | state=${bizState} | placeId=${placeId.substring(0,20)} | websiteHint=${websiteHint ? 'yes' : 'no'}`);
      // HERE leads have 'here_' prefix — skip Google Details, use text search instead
      let phone = null, siteUrl = websiteHint || null, address = null, reviewCount = null, businessStatus = null, hasHours = false;
      if (!placeId.startsWith('here_')) {
        const d = await googleGet(`/maps/api/place/details/json?place_id=${placeId}&fields=formatted_phone_number,website,formatted_address,opening_hours,business_status,user_ratings_total&key=${GOOGLE_API_KEY}`);
        phone   = d.result?.formatted_phone_number || null;
        siteUrl = d.result?.website || websiteHint || null;
        address = d.result?.formatted_address || null;
        reviewCount    = d.result?.user_ratings_total || null;
        businessStatus = d.result?.business_status || null;
        hasHours       = !!(d.result?.opening_hours);
        console.log(`[ENRICH] Google Details → phone=${phone ? 'YES' : 'NO'} | website=${siteUrl ? 'YES' : 'NO'}`);
      } else if (bizName) {
        // HERE lead — use text search to find Google place and get details
        try {
          const searchData = await googleGet(`/maps/api/place/textsearch/json?query=${encodeURIComponent(bizName)}&key=${GOOGLE_API_KEY}`);
          const gPlace = searchData.results?.[0];
          if (gPlace?.place_id) {
            const d = await googleGet(`/maps/api/place/details/json?place_id=${gPlace.place_id}&fields=formatted_phone_number,website,formatted_address,opening_hours,business_status,user_ratings_total&key=${GOOGLE_API_KEY}`);
            phone   = d.result?.formatted_phone_number || null;
            siteUrl = d.result?.website || websiteHint || null;
            address = d.result?.formatted_address || null;
            reviewCount    = d.result?.user_ratings_total || null;
            businessStatus = d.result?.business_status || null;
            hasHours       = !!(d.result?.opening_hours);
          }
        } catch(_) {}
      }
      const sosUrl = buildSOSUrl(bizName, bizState);

      // Run all enrichment in parallel: email scrape, SOS, Hunter.io, PDL
      const resolvedOfficer = officerParam || null; // use what client already has from auto-SOS
      const domain = siteUrl ? siteUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] : null;

      // Check cache first — if we've seen this domain before, use it instantly
      const cachedResult = domain ? await getCachedEmail(domain) : null;

      // Check owner cache before calling SOS
      // bizState is already parsed from the 'state' URL param above — use it directly
      // Don't try to extract state from bizName (business names don't contain state codes)
      const cachedOwnerData = await getCachedOwner(bizName, bizState);

      const [htmlEmail, sosData, hunterResult, pdlResult] = await Promise.all([
        // HTML email scrape — skip if cache hit
        (!cachedResult && siteUrl)
          ? Promise.race([scrapeEmail(siteUrl), new Promise(r => setTimeout(() => r(null), 10000))])
          : Promise.resolve(null),
        // SOS officer lookup
        Promise.race([
          scrapeSOS(bizName, bizState),
          new Promise(r => setTimeout(() => r(null), 5000))
        ]),
        // Hunter.io: domain-based email search (much better than HTML scraping)
        domain
          ? hunterDomainSearch(domain, resolvedOfficer)
          : Promise.resolve(null),
        // PDL: person lookup for owner cell + personal email
        resolvedOfficer
          ? pdlPersonLookup(resolvedOfficer, bizName, bizState)
          : Promise.resolve(null),
      ]);

      // Resolve best officer name (PDL might find a cleaner version)
      // Use cached owner if available, otherwise use SOS result
      const freshSOS = sosData;
      if (freshSOS?.officerName && !cachedOwnerData) {
        await cacheOwner(bizName, bizState, freshSOS).catch(()=>{});
      }
      const officerData = cachedOwnerData || freshSOS;
      const officerName = officerData?.officerName || resolvedOfficer || null;
      const officerType = officerData?.officerType || null;

      // Resolve best email — cache > pdl personal > hunter > html scrape > permutation
      const hunterEmail  = hunterResult?.email || null;
      const ownerEmail   = pdlResult?.ownerEmail || null;
      const scrapedEmail = htmlEmail || null;

      // Use cache hit if available
      const cacheEmail   = cachedResult?.email || null;
      const cacheSource  = cachedResult?.source || null;

      // If nothing found yet, try permutation estimate from officer name
      const permResult   = (!cacheEmail && !ownerEmail && !hunterEmail && !scrapedEmail && officerName && domain)
        ? bestPermutationGuess(officerName, domain)
        : null;

      const bestEmail = ownerEmail || cacheEmail || hunterEmail || scrapedEmail || permResult?.email || null;
      const emailSource = ownerEmail ? 'pdl-personal'
        : cacheEmail ? cacheSource
        : hunterEmail ? 'hunter'
        : scrapedEmail ? 'html-scrape'
        : permResult ? 'permutation-estimated'
        : null;

      // Store any new find in cache for future lookups (free for all clients)
      if (domain && bestEmail && !cacheEmail) {
        await cacheEmail(domain, bestEmail, emailSource).catch(()=>{});
      }

      // Owner direct phone from PDL
      const ownerPhone   = pdlResult?.ownerPhone || null;
      const linkedIn     = pdlResult?.linkedIn || (officerName
        ? `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(officerName + ' ' + bizName)}`
        : null);

      console.log(`[ENRICH] Result → phone=${phone ? 'YES' : 'NO'} | ownerPhone=${ownerPhone ? 'YES' : 'NO'} | email=${bestEmail || 'NONE'} (src:${emailSource}) | officer=${officerName ? officerName.substring(0,20) : 'NONE'} | linkedin=${linkedIn ? 'YES' : 'NO'}`);
      respond(res, 200, {
        phone, website: siteUrl, address, sosUrl,
        reviewCount, businessStatus, hasHours,
        // Owner contact
        email: bestEmail,
        emailSource,
        ownerPhone,
        ownerEmail,
        linkedIn,
        // Company data
        incorporationDate: sosData?.incorporationDate || null,
        businessAge: sosData?.businessAge || null,
        companyStatus: sosData?.companyStatus || null,
        officerName,
        officerType,
      });
    } catch(err) { console.error(err); respond(res, 500, { error: err.message }); }
    return;
  }

  // SBA LOOKUP — match business name against loaded SBA data
  if (url.pathname === "/sba-debug") {
    const decoded = verifyToken(req);
    if (!decoded) { respond(res, 401, { error: "Unauthorized" }); return; }
    if (!sbaIndex) { respond(res, 503, { status: "unavailable", message: sbaLoadError || "Not loaded" }); return; }
    const keys = Object.keys(sbaIndex);
    const testName = url.searchParams.get("name") || "";
    const testKey = testName ? normalizeName(testName) : "";
    const testResult = testName ? lookupSBA(testName, url.searchParams.get("state") || "") : null;
    // Find sample FL records
    const flSamples = [];
    for (const [k, records] of Object.entries(sbaIndex)) {
      if (records.some(r => r.state === "FL")) { flSamples.push({key: k, name: records[0].name, amount: records[0].amount}); }
      if (flSamples.length >= 10) break;
    }
    respond(res, 200, {
      total_keys: keys.length,
      sample_keys: keys.slice(0, 20),
      fl_samples: flSamples,
      test_input: testName,
      test_normalized: testKey,
      test_result: testResult,
    });
    return;
  }

  if (url.pathname === "/sba-lookup") {
    const decoded = verifyToken(req);
    if (!decoded) { respond(res, 401, { error: "Unauthorized" }); return; }
    const bizName  = url.searchParams.get("name") || "";
    const bizState = url.searchParams.get("state") || "";
    if (!bizName) { respond(res, 400, { error: "name required" }); return; }
    if (sbaLoading) { respond(res, 202, { status: "loading", message: "SBA data is still loading, try again shortly" }); return; }
    if (!sbaIndex) { respond(res, 503, { status: "unavailable", message: sbaLoadError || "SBA data not available" }); return; }
    const record = lookupSBA(bizName, bizState);
    if (!record) { respond(res, 200, { found: false }); return; }
    respond(res, 200, {
      found: true,
      name: record.name,
      city: record.city,
      state: record.state,
      loanAmount: record.amount,
      approvalDate: record.date,
      lender: record.lender,
      jobsSupported: record.jobs,
      naics: record.naics,
      estMonthlyRevenue: record.estMonthlyRevenue,
      estAnnualRevenue: record.estMonthlyRevenue * 12,
    });
    return;
  }

  // ── PROFILE UPDATE ──────────────────────────────────────────────
  if (url.pathname === "/profile" && req.method === "PUT") {
    const decoded = verifyToken(req);
    if (!decoded) { respond(res, 401, { error: "Unauthorized" }); return; }
    const { name, email, currentPassword, newPassword } = await getBody(req);
    try {
      const user = await getUser(decoded.userId);
      if (!user) { respond(res, 404, { error: "User not found" }); return; }
      const updates = [];
      const values = [];
      let i = 1;
      if (name !== undefined) { updates.push(`name = $${i++}`); values.push(name.trim()); }
      if (email && email !== user.email) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { respond(res, 400, { error: "Invalid email address" }); return; }
        const exists = await pool.query("SELECT id FROM users WHERE email = $1 AND id != $2", [email.toLowerCase().trim(), user.id]);
        if (exists.rows.length > 0) { respond(res, 409, { error: "Email already in use" }); return; }
        updates.push(`email = $${i++}`); values.push(email.toLowerCase().trim());
      }
      if (newPassword) {
        if (!currentPassword) { respond(res, 400, { error: "Current password required to set new password" }); return; }
        const valid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!valid) { respond(res, 401, { error: "Current password is incorrect" }); return; }
        if (newPassword.length < 8) { respond(res, 400, { error: "New password must be at least 8 characters" }); return; }
        const hash = await bcrypt.hash(newPassword, 12);
        updates.push(`password_hash = $${i++}`); values.push(hash);
      }
      if (updates.length === 0) { respond(res, 400, { error: "Nothing to update" }); return; }
      values.push(user.id);
      await pool.query(`UPDATE users SET ${updates.join(", ")} WHERE id = $${i}`, values);
      const updated = await getUser(user.id);
      const limit = PLAN_LIMITS[updated.plan];
      respond(res, 200, { message: "Profile updated", user: { id: updated.id, email: updated.email, name: updated.name, plan: updated.plan, searches_used: updated.searches_used, searches_remaining: limit === Infinity ? null : limit - updated.searches_used, limit: limit === Infinity ? null : limit, referral_code: updated.referral_code, plan_start_date: updated.plan_start_date, is_admin: updated.is_admin } });
    } catch(e) { console.error(e); respond(res, 500, { error: "Failed to update profile" }); }
    return;
  }

  // ── ADMIN: require admin flag ────────────────────────────────────
  function requireAdmin(decoded) {
    return pool.query("SELECT is_admin FROM users WHERE id = $1", [decoded.userId])
      .then(r => r.rows[0]?.is_admin === true);
  }

  // ── ADMIN: list all users ────────────────────────────────────────
  if (url.pathname === "/admin/users" && req.method === "GET") {
    const decoded = verifyToken(req);
    if (!decoded) { respond(res, 401, { error: "Unauthorized" }); return; }
    if (!(await requireAdmin(decoded))) { respond(res, 403, { error: "Forbidden" }); return; }
    try {
      const result = await pool.query(
        "SELECT id, email, name, plan, searches_used, searches_reset_date, is_admin, is_frozen, referral_code, referred_by, plan_start_date, created_at FROM users ORDER BY created_at DESC"
      );
      const users = result.rows.map(u => ({
        ...u,
        plan_limit: PLAN_LIMITS[u.plan] === Infinity ? null : PLAN_LIMITS[u.plan],
        mrr: u.plan === 'pro' ? 499 : u.plan === 'agency' ? 899 : u.plan === 'unlimited' ? 2299 : 0,
      }));
      respond(res, 200, { users });
    } catch(e) { console.error(e); respond(res, 500, { error: "Failed to fetch users" }); }
    return;
  }

  // ── ADMIN: freeze / unfreeze user ───────────────────────────────
  if (url.pathname.startsWith("/admin/users/") && url.pathname.endsWith("/freeze") && req.method === "PUT") {
    const decoded = verifyToken(req);
    if (!decoded) { respond(res, 401, { error: "Unauthorized" }); return; }
    if (!(await requireAdmin(decoded))) { respond(res, 403, { error: "Forbidden" }); return; }
    const targetId = parseInt(url.pathname.split("/")[3]);
    const { frozen } = await getBody(req);
    try {
      await pool.query("UPDATE users SET is_frozen = $1 WHERE id = $2", [!!frozen, targetId]);
      respond(res, 200, { message: frozen ? "Account frozen" : "Account unfrozen", id: targetId, is_frozen: !!frozen });
    } catch(e) { console.error(e); respond(res, 500, { error: "Failed to update account" }); }
    return;
  }

  // ── ADMIN: change user plan ──────────────────────────────────────
  if (url.pathname.startsWith("/admin/users/") && url.pathname.endsWith("/plan") && req.method === "PUT") {
    const decoded = verifyToken(req);
    if (!decoded) { respond(res, 401, { error: "Unauthorized" }); return; }
    if (!(await requireAdmin(decoded))) { respond(res, 403, { error: "Forbidden" }); return; }
    const targetId = parseInt(url.pathname.split("/")[3]);
    const { plan } = await getBody(req);
    if (!["pro","agency","unlimited"].includes(plan)) { respond(res, 400, { error: "Invalid plan" }); return; }
    try {
      await pool.query("UPDATE users SET plan = $1 WHERE id = $2", [plan, targetId]);
      respond(res, 200, { message: "Plan updated", id: targetId, plan });
    } catch(e) { console.error(e); respond(res, 500, { error: "Failed to update plan" }); }
    return;
  }

  // ── ADMIN: metrics ───────────────────────────────────────────────
  if (url.pathname === "/admin/metrics" && req.method === "GET") {
    const decoded = verifyToken(req);
    if (!decoded) { respond(res, 401, { error: "Unauthorized" }); return; }
    if (!(await requireAdmin(decoded))) { respond(res, 403, { error: "Forbidden" }); return; }
    try {
      const users = await pool.query("SELECT plan, is_frozen, referred_by, referral_code, created_at FROM users WHERE is_admin = FALSE");
      const all = users.rows;
      const active = all.filter(u => !u.is_frozen);
      const planPrices = { pro: 499, agency: 899, unlimited: 2299 };
      const planCounts = { pro: 0, agency: 0, unlimited: 0 };
      let grossMRR = 0;
      for (const u of active) {
        if (planCounts[u.plan] !== undefined) { planCounts[u.plan]++; grossMRR += planPrices[u.plan] || 0; }
      }
      // Stripe fees: 2.9% + 0.30 per transaction
      const stripeFees = active.reduce((sum, u) => sum + ((planPrices[u.plan] || 0) * 0.029 + 0.30), 0);
      const netMRR = grossMRR - stripeFees;
      // Referral tracking
      const referralMap = {};
      for (const u of all) {
        if (u.referred_by) {
          if (!referralMap[u.referred_by]) referralMap[u.referred_by] = [];
          referralMap[u.referred_by].push(u);
        }
      }
      const referralStats = Object.entries(referralMap).map(([code, refs]) => {
        const referrer = all.find(u => u.referral_code === code);
        const activeRefs = refs.filter(r => !r.is_frozen);
        const refMRR = activeRefs.reduce((s, r) => s + (planPrices[r.plan] || 0), 0);
        return { code, referrer_email: referrer?.email || "Unknown", total_referrals: refs.length, active_referrals: activeRefs.length, referred_mrr: refMRR };
      });
      // 30-day signups
      const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newSignups = all.filter(u => new Date(u.created_at) > thirtyDaysAgo).length;
      respond(res, 200, {
        gross_mrr: Math.round(grossMRR),
        net_mrr: Math.round(netMRR),
        stripe_fees_monthly: Math.round(stripeFees),
        overhead: 223,
        net_profit: Math.round(netMRR - 223),
        total_users: all.length,
        active_users: active.length,
        frozen_users: all.filter(u => u.is_frozen).length,
        plan_counts: planCounts,
        new_signups_30d: newSignups,
        referral_stats: referralStats,
        total_referred_users: all.filter(u => u.referred_by).length,
        // Payout liability at various rates
        referral_liability: {
          at_10pct: Math.round(referralStats.reduce((s, r) => s + r.referred_mrr * 0.10, 0)),
          at_15pct: Math.round(referralStats.reduce((s, r) => s + r.referred_mrr * 0.15, 0)),
          at_20pct: Math.round(referralStats.reduce((s, r) => s + r.referred_mrr * 0.20, 0)),
          at_25pct: Math.round(referralStats.reduce((s, r) => s + r.referred_mrr * 0.25, 0)),
        }
      });
    } catch(e) { console.error(e); respond(res, 500, { error: "Failed to get metrics" }); }
    return;
  }


  // ── STACKING DETECTOR — proxy CourtListener MCA search ─────────
  if (url.pathname === "/proxy-stacking" && req.method === "GET") {
    const decoded = verifyToken(req);
    if (!decoded) { respond(res, 401, { error: "Unauthorized" }); return; }
    const bizName = url.searchParams.get("name") || "";
    if (!bizName) { respond(res, 400, { error: "name required" }); return; }
    try {
      const query = encodeURIComponent(`"${bizName}" "merchant cash advance"`);
      const apiUrl = `https://www.courtlistener.com/api/rest/v3/dockets/?q=${query}&order_by=score+desc&format=json&page_size=5`;
      const clRes = await fetchURL(apiUrl);
      let count = 0;
      try {
        const parsed = JSON.parse(clRes);
        count = parsed.count || 0;
      } catch(_) { count = 0; }
      respond(res, 200, { count, name: bizName });
    } catch(e) { respond(res, 200, { count: 0, name: bizName }); }
    return;
  }

  respond(res, 404, { error: "Not found" });
});

// ─── SOS URLS ────────────────────────────────────────────────────
function buildSOSUrl(bizName, state) {
  const name = encodeURIComponent(bizName);
  const urls = {
    FL: `https://search.sunbiz.org/Inquiry/CorporationSearch/SearchResults?inquirytype=EntityName&searchTerm=${name}`,
    TX: `https://direct.sos.state.tx.us/corp_inquiry/corp_inquiry-entity_list.asp?corp_name=${name}&search_term=name&action=list&entity_type_cd=&filing_status_cd=A`,
    NY: `https://apps.dos.ny.gov/publicInquiry/#search?searchTerm=${name}&entity=DOS`,
    CA: `https://bizfileonline.sos.ca.gov/search/business?query=${name}`,
    GA: `https://ecorp.sos.ga.gov/BusinessSearch/BusinessInformation?nameContains=${name}`,
    NJ: `https://www.njportal.com/DOR/BusinessNameSearch/api/businessnames/search/beginswith?keywords=${name}`,
    IL: `https://apps.ilsos.gov/businessentitysearch/businessentitysearchresults.do?business_name=${name}&search_type=E`,
    OH: `https://businesssearch.ohiosos.gov/?=businessDetails&busName=${name}`,
    AZ: `https://ecorp.azcc.gov/BusinessSearch/Business?query=${name}`,
    CO: `https://www.sos.state.co.us/biz/BusinessEntityCriteriaExt.do?nameTyp=ENT&entName=${name}`,
    MD: `https://egov.maryland.gov/BusinessExpress/EntitySearch/Search?searchTerm=${name}`,
    MN: `https://mblsportal.sos.state.mn.us/Business/Search?BusinessName=${name}`,
  };
  return urls[state] || `https://www.google.com/search?q=${encodeURIComponent(bizName + " " + state + " registered agent owner")}`;
}

// ─── EMAIL CACHE — shared DB cache, scales to infinity ──────────
async function getCachedEmail(domain) {
  if (!domain) return null;
  try {
    const r = await pool.query(
      'UPDATE email_cache SET hit_count = hit_count + 1 WHERE domain = $1 RETURNING email, source',
      [domain.toLowerCase()]
    );
    if (r.rows.length > 0 && r.rows[0].email) {
      console.log(`[EMAIL-CACHE] HIT: ${domain} → ${r.rows[0].email} (src:${r.rows[0].source})`);
      return { email: r.rows[0].email, source: r.rows[0].source + '-cached' };
    }
    return null;
  } catch(_) { return null; }
}

async function cacheEmail(domain, email, source) {
  if (!domain || !email) return;
  try {
    await pool.query(
      `INSERT INTO email_cache (domain, email, source, found_at, hit_count)
       VALUES ($1, $2, $3, NOW(), 1)
       ON CONFLICT (domain) DO UPDATE
       SET email = $2, source = $3, found_at = NOW()`,
      [domain.toLowerCase(), email.toLowerCase(), source]
    );
    console.log(`[EMAIL-CACHE] STORED: ${domain} → ${email} (src:${source})`);
  } catch(_) {}
}

// ─── OWNER CACHE ─────────────────────────────────────────────────
async function getCachedOwner(bizName, state) {
  if (!bizName || !state) return null;
  const key = (bizName.toLowerCase().replace(/[^a-z0-9]/g,'').substring(0,40) + ':' + state.toUpperCase());
  try {
    const r = await pool.query(
      'UPDATE owner_cache SET hit_count = hit_count + 1 WHERE biz_key = $1 RETURNING officer_name, officer_type, incorporation_date, company_status',
      [key]
    );
    if (r.rows.length > 0 && r.rows[0].officer_name) {
      console.log(`[OWNER-CACHE] HIT: ${bizName}/${state} → ${r.rows[0].officer_name}`);
      return { officerName: r.rows[0].officer_name, officerType: r.rows[0].officer_type,
               incorporationDate: r.rows[0].incorporation_date, companyStatus: r.rows[0].company_status };
    }
    return null;
  } catch(_) { return null; }
}

async function cacheOwner(bizName, state, data) {
  if (!bizName || !state || !data?.officerName) return;
  const key = (bizName.toLowerCase().replace(/[^a-z0-9]/g,'').substring(0,40) + ':' + state.toUpperCase());
  try {
    await pool.query(
      `INSERT INTO owner_cache (biz_key, officer_name, officer_type, incorporation_date, company_status, state, found_at, hit_count)
       VALUES ($1,$2,$3,$4,$5,$6,NOW(),1)
       ON CONFLICT (biz_key) DO UPDATE
       SET officer_name=$2, officer_type=$3, incorporation_date=$4, company_status=$5, found_at=NOW()`,
      [key, data.officerName, data.officerType||null, data.incorporationDate||null, data.companyStatus||null, state.toUpperCase()]
    );
  } catch(_) {}
}


// ─── EMAIL PERMUTATION ENGINE ────────────────────────────────────
// Generates likely email addresses from officer name + domain
// No API, no credits, unlimited — based on real small biz patterns
function generateEmailPermutations(officerName, domain) {
  if (!officerName || !domain) return [];
  const parts = officerName.trim().toLowerCase().split(/\s+/).filter(p => p.length > 1);
  if (parts.length < 2) return [];
  const first = parts[0];
  const last = parts[parts.length - 1];
  const fi = first[0]; // first initial
  const li = last[0];  // last initial

  const d = domain.toLowerCase(); // always lowercase domain
  // Ordered by frequency for small businesses (< 50 employees)
  // Source: Interseller analysis of 5M+ companies
  return [
    `${first}@${d}`,           // john@        60% of small biz
    `${first}.${last}@${d}`,   // john.smith@  most common full name
    `${first}${last}@${d}`,    // johnsmith@
    `${fi}${last}@${d}`,       // jsmith@
    `${fi}.${last}@${d}`,      // j.smith@
    `info@${d}`,               // generic fallback — always exists
    `contact@${d}`,
    `${last}@${d}`,            // smith@
    `${first}${li}@${d}`,      // johnS@
    `${first}_${last}@${d}`,   // john_smith@
  ].filter((e, i, arr) => arr.indexOf(e) === i); // dedupe
}

// Score permutations — return best guess with confidence label
function bestPermutationGuess(officerName, domain) {
  const perms = generateEmailPermutations(officerName, domain);
  if (perms.length === 0) return null;
  // Top pick is always firstname@ for small biz — return it with "estimated" label
  return { email: perms[0], allGuesses: perms.slice(0, 5), source: 'permutation-estimated' };
}

// ─── MULTI-SOURCE EMAIL SCRAPER ──────────────────────────────────
// Scrapes business website + public directories (BBB, Yelp, Google)
// All free, no API, unlimited
async function scrapePublicDirectories(bizName, city, state) {
  const queries = [
    `${bizName} ${city} ${state} email contact`,
    `"${bizName}" "${city}" email`,
  ];
  const emails = [];
  for (const q of queries) {
    try {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
      const html = await Promise.race([
        fetchURL(searchUrl, 5000, 100000),
        new Promise(r => setTimeout(() => r(''), 5000))
      ]);
      if (!html) continue;
      const found = extractEmailsFromHtml(html);
      emails.push(...found);
    } catch(_) {}
  }
  return [...new Set(emails)];
}

// ─── EMAIL SCRAPER ───────────────────────────────────────────────
// Uses fetchURL (proper Chrome UA + full redirect following) for each page
async function fetchPageEmails(url) {
  try {
    const html = await Promise.race([
      fetchURL(url, 7000, 200000),
      new Promise(r => setTimeout(() => r(''), 7000))
    ]);
    if (!html) return [];
    return extractEmailsFromHtml(html);
  } catch(_) { return []; }
}

function extractEmailsFromHtml(html) {
  const emails = new Set();
  // 1. mailto: href — most reliable (explicit links)
  const mailtoRx = /href=["']mailto:([^"'?\s<>]+)/gi;
  let m;
  while ((m = mailtoRx.exec(html)) !== null) {
    const e = m[1].toLowerCase().replace(/&amp;/g,'').trim();
    if (e.includes('@') && !e.includes(' ')) emails.add(e);
  }
  // 2. JSON-LD structured data — Wix/WP/Squarespace often embed this
  const jsonldRx = /"email"\s*:\s*"([^"@\s]+@[^"\s]+)"/gi;
  while ((m = jsonldRx.exec(html)) !== null) emails.add(m[1].toLowerCase());
  // 3. Plain text regex
  const textRx = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  (html.match(textRx) || []).forEach(e => emails.add(e.toLowerCase()));
  // 4. Obfuscated: name [at] domain [dot] com or name(at)domain(dot)com
  const obfRx = /([a-zA-Z0-9._%+\-]+)\s*[\[\(]\s*at\s*[\]\)]\s*([a-zA-Z0-9.\-]+)\s*[\[\(]\s*dot\s*[\]\)]\s*([a-zA-Z]{2,})/gi;
  while ((m = obfRx.exec(html)) !== null) emails.add(`${m[1]}@${m[2]}.${m[3]}`.toLowerCase());
  // 5. HTML entities encoded: info&#64;domain.com
  const entRx = /([a-zA-Z0-9._%+\-]+)&#64;([a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/g;
  while ((m = entRx.exec(html)) !== null) emails.add(`${m[1]}@${m[2]}`.toLowerCase());
  return [...emails];
}

// ── HUNTER.IO — domain email search ──────────────────────────────
// Returns best email found at a domain, preferring owner-sounding ones
// Falls back to HTML scrape if no Hunter key or no results
async function hunterDomainSearch(domain, officerName) {
  if (!HUNTER_API_KEY || !domain) return null;
  try {
    const cleanDomain = domain.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
    const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(cleanDomain)}&api_key=${HUNTER_API_KEY}&limit=10`;
    const raw = await Promise.race([
      fetchURL(url, 5000),
      new Promise(r => setTimeout(() => r(null), 5000))
    ]);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const emails = data?.data?.emails || [];
    if (emails.length === 0) return null;

    // If we have an officer name, try to match first/last name to an email
    if (officerName) {
      const parts = officerName.trim().split(/\s+/);
      const firstName = parts[0]?.toLowerCase();
      const lastName  = parts[parts.length - 1]?.toLowerCase();
      // Direct name match in email local part
      const nameMatch = emails.find(e => {
        const local = e.value.split('@')[0].toLowerCase();
        return local.includes(firstName) || local.includes(lastName);
      });
      if (nameMatch) {
        console.log(`[HUNTER] Name match: ${nameMatch.value} (confidence: ${nameMatch.confidence})`);
        return { email: nameMatch.value, confidence: nameMatch.confidence, source: 'hunter-name' };
      }
    }

    // Otherwise return highest confidence non-generic email
    const genericPrefixes = ['info','contact','hello','admin','support','office','mail','team','sales','help','enquiries','billing','accounts'];
    const best = emails
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      .find(e => {
        const local = e.value.split('@')[0].toLowerCase();
        return !genericPrefixes.includes(local);
      });
    const fallback = emails.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];
    const result = best || fallback;
    if (result) {
      console.log(`[HUNTER] Best email: ${result.value} (confidence: ${result.confidence})`);
      return { email: result.value, confidence: result.confidence, source: 'hunter-domain' };
    }
    return null;
  } catch(e) {
    console.log('[HUNTER] error:', e.message);
    return null;
  }
}

// ── PEOPLE DATA LABS — owner phone + email lookup ─────────────────
// Uses person enrichment API: name + company → cell phone + personal email
async function pdlPersonLookup(officerName, bizName, bizState) {
  if (!PDL_API_KEY || !officerName || !bizName) return null;
  try {
    const parts = officerName.trim().split(/\s+/);
    const firstName = parts[0] || '';
    const lastName  = parts.slice(1).join(' ') || '';
    if (!firstName || !lastName) return null;

    const params = new URLSearchParams({
      first_name: firstName,
      last_name:  lastName,
      company:    bizName,
      region:     bizState || '',
      pretty:     'false',
    });
    const url = `https://api.peopledatalabs.com/v5/person/enrich?${params}`;
    const raw = await Promise.race([
      fetchURL(url + `&api_key=${PDL_API_KEY}`, 6000),
      new Promise(r => setTimeout(() => r(null), 6000))
    ]);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.status !== 200 || !data.data) return null;

    const person = data.data;
    // Extract best phone (mobile preferred)
    const phones = person.phone_numbers || [];
    const mobilePhone = phones.find(p => p.type === 'mobile')?.number
      || phones[0]?.number || null;

    // Personal email (not work domain)
    const workDomain = bizName.toLowerCase().replace(/[^a-z0-9]/g,'').substring(0,10);
    const emails = person.emails || [];
    const personalEmail = emails.find(e => !e.address.includes(workDomain))?.address
      || emails[0]?.address || null;

    const linkedIn = person.linkedin_url || null;

    console.log(`[PDL] ${officerName} → phone=${mobilePhone ? 'YES' : 'NO'} | email=${personalEmail ? 'YES' : 'NO'} | linkedin=${linkedIn ? 'YES' : 'NO'}`);
    return { ownerPhone: mobilePhone, ownerEmail: personalEmail, linkedIn, source: 'pdl' };
  } catch(e) {
    console.log('[PDL] error:', e.message);
    return null;
  }
}

async function scrapeEmail(siteUrl) {
  try {
    const urlObj = new URL(siteUrl);
    const base = `${urlObj.protocol}//${urlObj.hostname}`;
    // Extract root domain for matching: "www.miamiroofing.com" -> "miamiroofing.com"
    const siteDomain = urlObj.hostname.replace(/^www\./, '').toLowerCase();

    // Check contact pages first (highest yield), then homepage
    const paths = ["/contact", "/contact-us", "/contactus", "/about", "/about-us", "/", "/get-in-touch", "/contact.html", "/reach-us"];
    const results = await Promise.all(paths.map(p => fetchPageEmails(base + p)));
    const all = [...new Set(results.flat())];

    const noReplyPrefixes = ["noreply","no-reply","donotreply","do-not-reply","bounce","mailer-daemon","postmaster"];

    // ACCURACY RULE: only keep emails whose domain matches the business website domain
    // This eliminates all false positives (CDN emails, tracking pixels, partner emails, etc.)
    const siteEmails = all.filter(e => {
      if (!e.includes('@')) return false;
      const emailDomain = e.split('@')[1]?.toLowerCase().replace(/^www\./, '') || '';
      // Must be on same domain (exact match or subdomain)
      if (emailDomain !== siteDomain && !emailDomain.endsWith('.' + siteDomain)) return false;
      // Skip no-reply addresses
      if (noReplyPrefixes.some(p => e.split('@')[0].toLowerCase().startsWith(p))) return false;
      if (e.length > 70 || e.length < 6) return false;
      return true;
    });

    if (siteEmails.length === 0) {
      console.log(`[EMAIL] no on-domain emails found for ${siteDomain} | raw emails found: ${all.length}`);
      return null;
    }

    // Prefer personal-sounding over generic, but both are valid
    const genericPrefixes = ["info","contact","hello","admin","support","office","mail","team","help","enquiries","enquiry","sales"];
    const personal = siteEmails.find(e => !genericPrefixes.includes(e.split('@')[0].toLowerCase()));
    const result = personal || siteEmails[0];
    console.log(`[EMAIL] found: ${result} (from ${siteEmails.length} on-domain emails)`);
    return result;
  } catch(_) { return null; }
}

// ─── HERE PLACES SEARCH ──────────────────────────────────────────
async function hereSearch(term, lat, lng, limit) {
  if (!HERE_API_KEY) return [];
  try {
    const q = encodeURIComponent(term);
    const url = `https://discover.search.hereapi.com/v1/discover?at=${lat},${lng}&q=${q}&limit=${Math.min(limit, 100)}&in=countryCode%3AUSA&apiKey=${HERE_API_KEY}`;
    const raw = await fetchURL(url, 6000);
    const data = JSON.parse(raw);
    return (data.items || []).map(item => ({
      businessName: item.title,
      address: item.address?.label || '',
      phone: item.contacts?.[0]?.phone?.[0]?.value || null,
      website: item.contacts?.[0]?.www?.[0]?.value || null,
      placeId: 'here_' + item.id,
      rating: null,
      reviewCount: 0,
      source: 'here',
    }));
  } catch(_) { return []; }
}

// ─── FL + TX + GA SOS SCRAPERS ───────────────────────────────────

// Master dispatcher — picks scraper by state

// ─── SOS SCRAPERS — 14 STATES ────────────────────────────────────
// Each returns: { officerName, officerType, incorporationDate, businessAge, companyStatus }
// officerType: 'owner' = confirmed principal/officer
//              'agent' = registered agent (not owner, still useful for contact)
//              null    = unknown

// ─── KNOWN REGISTERED AGENT SERVICES ────────────────────────────
// These are NEVER the actual business owner — filter them out
const KNOWN_RA_SERVICES = new Set([
  'ct corporation','ct corporation system','corporation service company','csc',
  'northwest registered agents','northwest registered agent','nra inc',
  'national registered agents','nrai services','national corporate research',
  'cogency global','legalzoom','legalzoom.com',
  'incorp services','incorp.com','incorp','incorporate.com',
  'registered agent solutions','ras','business filings incorporated',
  'wolters kluwer','wolters kluwer ct corporation',
  'united states corporation agents','usca',
  'harvard business services','harvard business services inc',
  'the company corporation','company corporation',
  'statutory agent inc','registered agents inc',
  'parasec','paracorp','paracorp incorporated',
  'capitol services','capitol corporate services',
  'vcorp services','vcorp','v corp',
  'spiegel & utrera','spiegel and utrera',
  'florida department of state','secretary of state',
  'national corp research','intl registered agent',
  'agent for service of process','c t corporation',
  'registered agent group','registered office',
  'abc registered agents','1st choice international',
]);

function isKnownRAService(name) {
  if (!name) return false;
  const n = name.toLowerCase().trim();
  // Exact match
  if (KNOWN_RA_SERVICES.has(n)) return true;
  // Partial match for common patterns
  if (n.includes('registered agent') && n.length > 20) return true;
  if (n.includes('ct corp')) return true;
  if (n.includes('corporation service')) return true;
  if (n.includes('legalzoom')) return true;
  if (n.includes('northwest reg')) return true;
  if (n.includes('cogency')) return true;
  if (n.includes('vcorp') || n.includes('v corp')) return true;
  if (n.includes('parasec') || n.includes('paracorp')) return true;
  if (n.includes('incorp') && n.includes('service')) return true;
  // Single word all-caps that's just a city/state
  if (/^[A-Z]{2}$/.test(name.trim())) return true;
  return false;
}

// Clean officer name — remove titles, extra whitespace
function cleanOfficerName(name) {
  if (!name) return null;
  return name
    .replace(/,?\s*(president|secretary|treasurer|director|manager|member|ceo|cfo|coo|vp|vice president|registered agent|agent)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}


// ─── OWNER NAME FALLBACK — scrape Manta + BBB ────────────────────
// These are public business directories that often list the owner name
// No API, no credits, unlimited
async function scrapeOwnerFromDirectories(bizName, city, state) {
  try {
    // Try Manta first — very reliable owner name source for small businesses
    const mantaQ = encodeURIComponent(`${bizName} ${city} ${state}`);
    const mantaHtml = await Promise.race([
      fetchURL(`https://www.manta.com/search?search_source=nav&search=${mantaQ}`, 5000),
      new Promise(r => setTimeout(() => r(''), 5000))
    ]);
    if (mantaHtml && mantaHtml.length > 500) {
      // Manta shows "Owner: John Smith" or "John Smith, Owner" patterns
      const ownerMatch = mantaHtml.match(/(?:Owner|President|CEO|Founder)[:\s]*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,3})/i) ||
                         mantaHtml.match(/([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,2})(?:[\s,]*(?:Owner|President|CEO|Founder))/i);
      if (ownerMatch) {
        const n = ownerMatch[1].trim();
        if (!isKnownRAService(n) && n.split(' ').length >= 2) {
          console.log(`[MANTA] Found owner for "${bizName}": ${n}`);
          return { officerName: n, officerType: 'owner', source: 'manta' };
        }
      }
    }
  } catch(_) {}

  try {
    // Try BBB — also lists owner/principal names
    const bbbQ = encodeURIComponent(`${bizName} ${city} ${state}`);
    const bbbHtml = await Promise.race([
      fetchURL(`https://www.bbb.org/search?find_text=${bbbQ}&find_loc=${encodeURIComponent(`${city}, ${state}`)}`, 5000),
      new Promise(r => setTimeout(() => r(''), 5000))
    ]);
    if (bbbHtml && bbbHtml.length > 500) {
      const principalMatch = bbbHtml.match(/(?:Principal|Owner|Contact)[:\s]*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,3})/i);
      if (principalMatch) {
        const n = principalMatch[1].trim();
        if (!isKnownRAService(n) && n.split(' ').length >= 2) {
          console.log(`[BBB] Found owner for "${bizName}": ${n}`);
          return { officerName: n, officerType: 'owner', source: 'bbb' };
        }
      }
    }
  } catch(_) {}

  return null;
}

async function scrapeSOS(bizName, stateCode) {
  const supported = { FL:scrapeFL, TX:scrapeTX, GA:scrapeGA, NY:scrapeNY,
    CA:scrapeCA, IL:scrapeIL, AZ:scrapeAZ, CO:scrapeCO, OH:scrapeOH,
    PA:scrapePA, NC:scrapeNC, NJ:scrapeNJ, VA:scrapeVA, WA:scrapeWA };
  const fn = supported[stateCode];
  if (!fn) return null;
  try {
    const result = await Promise.race([fn(bizName), new Promise(r => setTimeout(()=>r(null), 7000))]);
    if (!result) return null;
    // Apply RA service filter — mark type, don't discard (agent is still useful)
    if (result.officerName && isKnownRAService(result.officerName)) {
      result.officerType = 'agent';
    }
    result.officerName = cleanOfficerName(result.officerName);
    if (!result.officerName) result.officerName = null;
    return result;
  } catch(_) { return null; }
}

// ── FLORIDA — Sunbiz (two-step: search → detail page) ─────────────
// FL is the most reliable — law requires all officers listed publicly
async function scrapeFL(bizName) {
  try {
    const q = encodeURIComponent(bizName);
    const searchHtml = await fetchURL(
      `https://search.sunbiz.org/Inquiry/CorporationSearch/SearchResults?inquirytype=EntityName&searchNameOrder=&masterDataToSearch=&inquiryDirectionType=ForwardList&startingDetailId=&viewType=DetailView&searchStatus=Active&filingType=All&searchTerm=${q}`
    );
    const objMatch = searchHtml.match(/GetFilingInformation\?objectId=([A-Z0-9]+)/);
    if (!objMatch) return null;

    const detailHtml = await fetchURL(
      `https://search.sunbiz.org/Inquiry/CorporationSearch/GetFilingInformation?objectId=${objMatch[1]}`
    );

    // Filing date
    const filedMatch = detailHtml.match(/Filing Date[^<]*<[^>]+>([^<]{6,20})</) ||
                       detailHtml.match(/Date Filed[^<]*<[^>]+>([^<]{6,20})</) ||
                       detailHtml.match(/(\d{2}\/\d{2}\/\d{4})/);
    const incDate = filedMatch ? filedMatch[1].trim() : null;

    // Status
    const statusMatch = detailHtml.match(/(?:Status)[^<]*<[^>]+>([^<]{3,20})</) ||
                        detailHtml.match(/\b(Active|Inactive|Dissolved)\b/i);
    const companyStatus = statusMatch ? statusMatch[1].trim() : null;

    // Officers — Sunbiz shows them AFTER "Officer/Director Detail" section
    // Pattern: name in a <span> or <td>, followed by title in next cell
    const officerSection = detailHtml.indexOf('Officer/Director Detail');
    let officerName = null;
    let officerType = null;

    if (officerSection !== -1) {
      const section = detailHtml.slice(officerSection, officerSection + 3000);
      // Extract all text in span/td that looks like a proper name (2+ words, mixed case or all caps)
      const namePattern = /<(?:span|td|p)[^>]*>\s*([A-Z][A-Za-z\s'-]{2,}(?:\s+[A-Z][A-Za-z'-]+)+)\s*<\/(?:span|td|p)>/g;
      const skipList = new Set(['OFFICER','DIRECTOR','MANAGER','MEMBER','PRESIDENT','SECRETARY',
        'TREASURER','REGISTERED','AGENT','FLORIDA','ACTIVE','INACTIVE','DISSOLVED',
        'UNITED STATES','ADDRESS','CITY','STATE','ZIP','TITLE','NAME','TYPE',
        'OFFICER TYPE','DIRECTOR DETAIL','DETAIL INFORMATION']);
      let m;
      while ((m = namePattern.exec(section)) !== null) {
        const candidate = m[1].trim();
        // Must have 2+ words, not a skip word, not all numeric, not a city/state phrase
        if (candidate.split(/\s+/).length >= 2 &&
            !skipList.has(candidate.toUpperCase()) &&
            !candidate.match(/^\d/) &&
            candidate.length >= 4) {
          officerName = candidate;
          officerType = 'owner'; // Sunbiz officer section = confirmed owner
          break;
        }
      }
    }

    // Fallback: look for name before "P" (President) or "D" (Director) title markers
    if (!officerName) {
      const titleMatch = detailHtml.match(/([A-Z][A-Za-z\s'-]{5,40})\s*(?:<[^>]+>)?\s*(?:P|D|VP|T|S)\s*(?:<|\n|\s{2})/);
      if (titleMatch) { officerName = titleMatch[1].trim(); officerType = 'owner'; }
    }

    console.log(`[SOS FL] "${bizName}" → officer=${officerName||'NONE'} type=${officerType||'?'} date=${incDate||'?'} status=${companyStatus||'?'}`);
    return { incorporationDate: incDate, businessAge: parseAge(incDate), companyStatus, officerName, officerType };
  } catch(e) {
    console.log(`[SOS FL] ERROR "${bizName}": ${e.message}`);
    return null;
  }
}

// ── TEXAS — SOS Direct (two-step: search → entity detail) ─────────
// FIXED: was using wrong site (Comptroller). Now uses actual TX SOS.
async function scrapeTX(bizName) {
  try {
    const q = encodeURIComponent(bizName);
    // TX SOS entity search — returns list of matches
    const html = await fetchURL(
      `https://direct.sos.state.tx.us/corp_inquiry/corp_inquiry-entity_list.asp?bik_ein=&corp_name=${q}&corp_num=&entity_type_cd=&filing_status_cd=A&action=list&search_term=name`
    );
    // Get first entity detail link
    const entityMatch = html.match(/corp_inquiry-entity_name\.asp\?[^"']*corp_num=([\d]+)/i) ||
                        html.match(/corp_num=([0-9]+)/);
    if (!entityMatch) {
      // No results page — try direct parse
      const dateMatch = html.match(/(\d{2}\/\d{2}\/\d{4})/);
      const incDate = dateMatch ? dateMatch[1] : null;
      const statusMatch = html.match(/\b(Active|Inactive|Forfeited|Dissolved|Exists)\b/i);
      const agentMatch = html.match(/Registered Agent[^A-Z]*([A-Z][A-Za-z\s,.'-]{3,50})(?:<|\n)/);
      const officerName = agentMatch ? agentMatch[1].trim() : null;
      const officerType = officerName ? (isKnownRAService(officerName) ? 'agent' : 'unknown') : null;
      return { incorporationDate: incDate, businessAge: parseAge(incDate), companyStatus: statusMatch?.[1] || null, officerName, officerType };
    }

    // Fetch entity detail page which has officer information
    const corpNum = entityMatch[1];
    const detailHtml = await fetchURL(
      `https://direct.sos.state.tx.us/corp_inquiry/corp_inquiry-entity_name.asp?corp_num=${corpNum}`
    );

    const dateMatch = detailHtml.match(/(?:Formation Date|Date Formed|SOS Receipt Date)[^\d]*(\d{1,2}\/\d{1,2}\/\d{4})/i) ||
                      detailHtml.match(/(\d{2}\/\d{2}\/\d{4})/);
    const incDate = dateMatch ? dateMatch[1] : null;

    const statusMatch = detailHtml.match(/\b(Active|Inactive|Forfeited|Dissolved)\b/i);

    // TX detail page has Officer/Director info in table
    const officerSection = detailHtml.indexOf('Officer');
    let officerName = null, officerType = null;
    if (officerSection !== -1) {
      const section = detailHtml.slice(officerSection, officerSection + 2000);
      const nameMatch = section.match(/<td[^>]*>\s*([A-Z][A-Za-z\s,.'-]{5,50})\s*<\/td>/);
      if (nameMatch && !isKnownRAService(nameMatch[1])) {
        officerName = nameMatch[1].trim();
        officerType = 'owner';
      }
    }
    // Fallback to registered agent
    if (!officerName) {
      const agentMatch = detailHtml.match(/Registered Agent[^A-Z]*([A-Z][A-Za-z\s,.'-]{3,50})(?:<|\n)/);
      if (agentMatch) { officerName = agentMatch[1].trim(); officerType = isKnownRAService(officerName) ? 'agent' : 'unknown'; }
    }

    console.log(`[SOS TX] "${bizName}" → officer=${officerName||'NONE'} type=${officerType||'?'}`);
    return { incorporationDate: incDate, businessAge: parseAge(incDate), companyStatus: statusMatch?.[1] || null, officerName, officerType };
  } catch(e) { console.log(`[SOS TX] ERROR: ${e.message}`); return null; }
}

// ── GEORGIA — eCorp (two-step: search → entity detail) ────────────
async function scrapeGA(bizName) {
  try {
    const q = encodeURIComponent(bizName);
    // Step 1: search for the entity to get its control number
    const searchHtml = await fetchURL(
      `https://ecorp.sos.ga.gov/BusinessSearch/BusinessInformation?nameContains=${q}&businessType=&businessStatus=Active&SortField=BusinessName&SortOrder=asc&SearchMode=2&StartIndex=0&NumResults=5`,
      5000
    );
    // Pull control number from first result link
    const ctrlMatch = searchHtml.match(/BusinessDetails[?&]id=([\d]+)/) ||
                      searchHtml.match(/control_num=([\d]+)/) ||
                      searchHtml.match(/\/BusinessSearch\/BusinessInformation\?businessId=([\d]+)/);

    // Parse search results page first (has some data)
    const dateMatch = searchHtml.match(/(?:Formation|Registration|Filing|Incorporated)[^\d]*(\d{1,2}\/\d{1,2}\/\d{4})/) ||
                      searchHtml.match(/(?:Formation|Registration|Filing|Incorporated)[^\d]*(\d{4}-\d{2}-\d{2})/);
    const incDate = dateMatch ? dateMatch[1] : null;
    const statusMatch = searchHtml.match(/\b(Active|Inactive|Dissolved|Revoked|Admin Dissolved)\b/i);
    const companyStatus = statusMatch ? statusMatch[0] : null;

    let officerName = null, officerType = null;

    if (ctrlMatch) {
      // Step 2: get entity detail page which has principal officer info
      const detailHtml = await fetchURL(
        `https://ecorp.sos.ga.gov/BusinessSearch/BusinessInformation?businessId=${ctrlMatch[1]}`,
        5000
      ).catch(() => '');

      // GA detail shows principal office / registered agent in separate sections
      const principalMatch = detailHtml.match(/(?:Principal|Officer|Manager|Organizer)[^A-Z]*([A-Z][A-Za-z\s,.'-]{5,50})(?:<|\n)/i);
      const agentMatch = detailHtml.match(/Registered Agent[^A-Z]*([A-Z][A-Za-z\s,.'-]{3,50})(?:<|\n)/i);

      if (principalMatch && !isKnownRAService(principalMatch[1])) {
        officerName = principalMatch[1].trim();
        officerType = 'owner';
      } else if (agentMatch) {
        officerName = agentMatch[1].trim();
        officerType = isKnownRAService(officerName) ? 'agent' : 'unknown';
      }
    }

    // Fallback: parse directly from search list HTML
    if (!officerName) {
      const agentMatch = searchHtml.match(/Registered Agent[^A-Z]*([A-Z][A-Za-z\s,.'-]{3,60})(?:<|\n)/);
      if (agentMatch) { officerName = agentMatch[1].trim(); officerType = isKnownRAService(officerName) ? 'agent' : 'unknown'; }
    }

    console.log(`[SOS GA] "${bizName}" → officer=${officerName||'NONE'} type=${officerType||'?'}`);
    return { incorporationDate: incDate, businessAge: parseAge(incDate), companyStatus, officerName, officerType };
  } catch(e) { console.log(`[SOS GA] ERROR: ${e.message}`); return null; }
}

// ── NEW YORK — DOS Open Data API ──────────────────────────────────
// Dataset has chief_executive_name for corporations, not always for LLCs
async function scrapeNY(bizName) {
  try {
    const q = encodeURIComponent(bizName.replace(/'/g,''));
    const json = await fetchURL(
      `https://data.ny.gov/resource/ej5i-h7qk.json?$where=current_entity_name+like+%27${q}%25%27&$limit=5`,
      5000
    );
    const data = JSON.parse(json);
    const biz = data?.[0];
    if (!biz) return null;

    const incDate = biz.date_of_initial_dos_filing || biz.initial_dos_filing_date || null;
    // NY DOS dataset field names - different for Corp vs LLC
    // Corporations: chief_executive_name (CEO/President)
    // LLCs: organizer_name (the person who filed/organized the LLC)
    // dos_process_name = person to receive legal process (often registered agent)
    const ceoCand      = biz.chief_executive_name || biz.ceo_name || null;
    const orgCand      = biz.organizer_name || biz.initial_dos_filing_by || null;
    const dosCand      = biz.dos_process_name || null;
    // Prefer actual owner (CEO/organizer) over registered process agent
    const rawOfficer   = (!ceoCand || isKnownRAService(ceoCand)) ? orgCand : ceoCand;
    const fallbackAgent = (!rawOfficer && dosCand && !isKnownRAService(dosCand)) ? dosCand : null;
    const officerName  = rawOfficer || fallbackAgent || null;
    const officerType  = !officerName ? null
      : isKnownRAService(officerName) ? 'agent'
      : (ceoCand && officerName === ceoCand) ? 'owner'
      : (orgCand && officerName === orgCand) ? 'owner'
      : 'unknown';

    console.log(`[SOS NY] "${bizName}" → officer=${officerName||'NONE'} type=${officerType||'?'}`);
    return {
      incorporationDate: incDate ? incDate.split('T')[0] : null,
      businessAge: parseAge(incDate),
      companyStatus: biz.current_entity_status || biz.dos_process_status || null,
      officerName, officerType
    };
  } catch(e) { console.log(`[SOS NY] ERROR: ${e.message}`); return null; }
}

// ── CALIFORNIA — BizFile Online API ──────────────────────────────
async function scrapeCA(bizName) {
  try {
    const q = encodeURIComponent(bizName);
    const json = await fetchURL(
      `https://bizfileonline.sos.ca.gov/api/Records/businesssearch?SearchValue=${q}&SearchType=NAME&SearchField=NAME&SearchActiveOnly=true&SearchCertificated=false&SearchPage=0`,
      5000
    );
    const data = JSON.parse(json);
    // CA BizFile API response: data.hits.hits[0]._source has the entity
    const src = data?.hits?.hits?.[0]?._source || data?.results?.[0] || null;
    if (!src) return null;

    const incDate = src.REGISTRATION_DATE || src.registration_date || src.DATE_FILED || src.date_filed || null;
    const companyStatus = src.STATUS || src.status || src.ENTITY_STATUS || null;

    // CA BizFile API actual field names (verified against BizFile schema)
    // OFFICERS is an array of {officerTitle, officerName} — present in detail response
    // For search results, AGENT_FOR_SERVICE_OF_PROCESS is most reliable
    const officers = src.OFFICERS || src.officers || [];
    let officerName = null, officerType = 'unknown';
    // Try to find a real person in the officers array
    if (Array.isArray(officers) && officers.length > 0) {
      const realOfficer = officers.find(o => {
        const n = (o.officerName || o.name || o.OFFICER_NAME || '').trim();
        return n && !isKnownRAService(n) && n.split(' ').length >= 2;
      });
      if (realOfficer) {
        officerName = (realOfficer.officerName || realOfficer.name || '').trim();
        officerType = 'owner';
      }
    }
    // Fallback: agent for service (may be a person for small LLC)
    if (!officerName) {
      const agentRaw = src.AGENT_FOR_SERVICE_OF_PROCESS || src.agent_for_service_of_process || src.AGENT_NAME || '';
      const agentStr = String(agentRaw).replace(/\d.*$/, '').trim(); // strip addresses
      if (agentStr && agentStr.length > 3 && agentStr.split(' ').length >= 2) {
        officerName = agentStr;
        officerType = isKnownRAService(agentStr) ? 'agent' : 'unknown';
      }
    }

    console.log(`[SOS CA] "${bizName}" → officer=${officerName||'NONE'} type=${officerType||'?'}`);
    return { incorporationDate: incDate, businessAge: parseAge(incDate), companyStatus, officerName, officerType };
  } catch(e) { console.log(`[SOS CA] ERROR: ${e.message}`); return null; }
}

// ── ILLINOIS — ILSOS ──────────────────────────────────────────────
async function scrapeIL(bizName) {
  try {
    const q = encodeURIComponent(bizName);
    const html = await fetchURL(
      `https://www.ilsos.gov/corporatellc/CorporateLlcController?action=CorpLlcSearch&SearchType=1&searchCriteria=${q}&SearchBtn=Search`,
      5000
    );
    const dateMatch = html.match(/(?:Date Filed|File Date|Incorporation Date)[^\d]*(\d{1,2}\/\d{1,2}\/\d{4})/i) ||
                      html.match(/(\d{2}\/\d{2}\/\d{4})/);
    const incDate = dateMatch ? dateMatch[1] : null;
    const statusMatch = html.match(/\b(Active|Good Standing|Dissolved|Revoked)\b/i);
    // IL: registered agent appears after "Registered Agent:" label
    const agentMatch = html.match(/Registered Agent[:\s]*([A-Z][A-Za-z\s,.'-]{3,50})(?:<|\n|\r)/);
    const officerName = agentMatch ? agentMatch[1].trim() : null;
    const officerType = officerName ? (isKnownRAService(officerName) ? 'agent' : 'unknown') : null;
    return { incorporationDate: incDate, businessAge: parseAge(incDate), companyStatus: statusMatch?.[1] || null, officerName, officerType };
  } catch(_) { return null; }
}

// ── ARIZONA — ACC ─────────────────────────────────────────────────
async function scrapeAZ(bizName) {
  // AZ Corporation Commission - use their public search API
  try {
    const q = encodeURIComponent(bizName);
    // AZ SOS Open Data (CKAN) endpoint — stable JSON API
    const json = await fetchURL(
      `https://api.azsos.gov/business/search?Name=${q}&Status=Active`,
      5000
    );
    const data = JSON.parse(json);
    const biz = Array.isArray(data?.results) ? data.results[0] : Array.isArray(data) ? data[0] : null;
    if (!biz) return null;
    const incDate = biz.formationDate || biz.incorporationDate || biz.filedDate || null;
    const rawOfficer = biz.principalOfficerName || biz.presidentName || biz.managerName || biz.agentName || null;
    const officerName = rawOfficer ? String(rawOfficer).trim() : null;
    const officerType = officerName ? (isKnownRAService(officerName) ? 'agent' : 'unknown') : null;
    return { incorporationDate: incDate, businessAge: parseAge(incDate), companyStatus: biz.status || null, officerName, officerType };
  } catch(_) { return null; }
}

// ── COLORADO — SOS ────────────────────────────────────────────────
async function scrapeCO(bizName) {
  // CO SOS is JS-rendered — use Colorado Open Data portal (Socrata JSON API)
  try {
    const q = encodeURIComponent(bizName.replace(/'/g,"''"));
    const json = await fetchURL(
      `https://data.colorado.gov/resource/4ykn-tg5h.json?$where=entityname+like+%27${encodeURIComponent(bizName.replace(/'/g,"''"))}%25%27&$limit=5`,
      5000
    );
    const data = JSON.parse(json);
    const biz = data?.[0];
    if (!biz) return null;
    const incDate = biz.formationdate || biz.date_formed || null;
    const officerName = biz.principalofficer || biz.registeredagent || null;
    const officerType = officerName ? (isKnownRAService(officerName) ? 'agent' : 'unknown') : null;
    return { incorporationDate: incDate ? incDate.split('T')[0] : null, businessAge: parseAge(incDate), companyStatus: biz.entitystatus || null, officerName, officerType };
  } catch(_) { return null; }
}

// ── OHIO — SOS ────────────────────────────────────────────────────
async function scrapeOH(bizName) {
  // Ohio SOS is JS-rendered — use Ohio Open Data portal (Socrata JSON API)
  try {
    const q = encodeURIComponent(bizName);
    const json = await fetchURL(
      `https://data.ohio.gov/resource/xn5t-hpek.json?$where=entity_name+like+%27${encodeURIComponent(bizName)}%25%27&$limit=5`,
      5000
    );
    const data = JSON.parse(json);
    const biz = data?.[0];
    if (!biz) return null;
    const incDate = biz.formation_date || biz.date_filed || null;
    // OH Open Data: statutory_agent_name is the most reliable officer field
    const agentRaw = biz.statutory_agent_name || biz.principal_name || null;
    const officerName = agentRaw ? String(agentRaw).trim() : null;
    const officerType = officerName ? (isKnownRAService(officerName) ? 'agent' : 'unknown') : null;
    return { incorporationDate: incDate ? incDate.split('T')[0] : null, businessAge: parseAge(incDate), companyStatus: biz.status || null, officerName, officerType };
  } catch(_) { return null; }
}

// ── PENNSYLVANIA — DOS ────────────────────────────────────────────
async function scrapePA(bizName) {
  // PA DOS is JS-rendered. Use PA open data / MANTA fallback handled in scrapeSOS
  // PA open data doesn't have a reliable business entity API; return null and let fallback handle it
  return null;
}

// ── NORTH CAROLINA — SOS ──────────────────────────────────────────
async function scrapeNC(bizName) {
  // NC SOS is JS-rendered (React). Use NC open data portal (Socrata)
  try {
    const json = await fetchURL(
      `https://data.nc.gov/resource/q8kx-hss2.json?$where=entity_name+like+%27${encodeURIComponent(bizName)}%25%27&$limit=5`,
      5000
    );
    const data = JSON.parse(json);
    const biz = data?.[0];
    if (!biz) return null;
    const incDate = biz.date_formed || biz.formation_date || null;
    const officerName = biz.registered_agent || biz.principal_office_contact || null;
    const officerType = officerName ? (isKnownRAService(officerName) ? 'agent' : 'unknown') : null;
    return { incorporationDate: incDate ? incDate.split('T')[0] : null, businessAge: parseAge(incDate), companyStatus: biz.status || null, officerName, officerType };
  } catch(_) { return null; }
}

// ── NEW JERSEY — Treasury ─────────────────────────────────────────
async function scrapeNJ(bizName) {
  // NJ Portal is JS-rendered. NJ Treasury provides a search API
  try {
    const json = await fetchURL(
      `https://www.njportal.com/DOR/businessrecords/api/EntitySearch?name=${encodeURIComponent(bizName)}&status=A&page=1&pageSize=5`,
      5000
    );
    const data = JSON.parse(json);
    const biz = data?.items?.[0] || data?.[0] || null;
    if (!biz) return null;
    const incDate = biz.incorporationDate || biz.formationDate || biz.dateFormed || null;
    const officerName = biz.agentName || biz.principalName || biz.registeredAgent || null;
    const officerType = officerName ? (isKnownRAService(officerName) ? 'agent' : 'unknown') : null;
    return { incorporationDate: incDate, businessAge: parseAge(incDate), companyStatus: biz.status || biz.entityStatus || null, officerName, officerType };
  } catch(_) { return null; }
}

// ── VIRGINIA — SCC ────────────────────────────────────────────────
async function scrapeVA(bizName) {
  // VA SCC - use their REST API
  try {
    const json = await fetchURL(
      `https://cis.scc.virginia.gov/api/v1/EntitySearch/GetEntitySearchResults?searchTerm=${encodeURIComponent(bizName)}&searchType=0&page=1&pageSize=5`,
      5000
    );
    const data = JSON.parse(json);
    const biz = data?.entityList?.[0] || data?.results?.[0] || data?.[0] || null;
    if (!biz) return null;
    const incDate = biz.formationDate || biz.incorporationDate || biz.dateFormed || null;
    const officerName = biz.registeredAgentName || biz.principalOfficerName || biz.agentName || null;
    const officerType = officerName ? (isKnownRAService(officerName) ? 'agent' : 'unknown') : null;
    return { incorporationDate: incDate, businessAge: parseAge(incDate), companyStatus: biz.status || biz.entityStatus || null, officerName, officerType };
  } catch(_) { return null; }
}

// ── WASHINGTON — Corporations Division ───────────────────────────
async function scrapeWA(bizName) {
  // WA SOS CCFS - use their data API
  try {
    const json = await fetchURL(
      `https://ccfs.sos.wa.gov/api/v1/businesssearch/businesses/${encodeURIComponent(bizName)}/businesslist`,
      5000
    );
    const data = JSON.parse(json);
    const biz = Array.isArray(data) ? data[0] : data?.results?.[0] || data?.BusinessList?.[0];
    if (!biz) return null;
    const incDate = biz.IncorporationDate || biz.FormationDate || biz.incorporationDate || null;
    const rawOfficer = biz.RegisteredAgentName || biz.PrincipalOfficer || biz.registeredAgentName || null;
    const officerName = rawOfficer ? String(rawOfficer).trim() : null;
    const officerType = officerName ? (isKnownRAService(officerName) ? 'agent' : 'unknown') : null;
    return { incorporationDate: incDate, businessAge: parseAge(incDate), companyStatus: biz.Status || biz.status || null, officerName, officerType };
  } catch(_) { return null; }
}


function parseAge(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d)) return null;
    return Math.floor((Date.now() - d) / (1000*60*60*24*365));
  } catch(_) { return null; }
}

// ── FLORIDA — Sunbiz ─────────────────────────────────────────────
async function scrapeFL(bizName) {
  try {
    const q = encodeURIComponent(bizName);
    const searchHtml = await fetchURL(
      `https://search.sunbiz.org/Inquiry/CorporationSearch/SearchResults?inquirytype=EntityName&searchNameOrder=&masterDataToSearch=&inquiryDirectionType=ForwardList&startingDetailId=&viewType=DetailView&searchStatus=Active&filingType=All&searchTerm=${q}`
    );
    // Pull first detail link e.g. /Inquiry/CorporationSearch/GetFilingInformation?objectId=P21000012345
    const objMatch = searchHtml.match(/GetFilingInformation\?objectId=([A-Z0-9]+)/);
    if (!objMatch) return null;

    const detailHtml = await fetchURL(
      `https://search.sunbiz.org/Inquiry/CorporationSearch/GetFilingInformation?objectId=${objMatch[1]}`
    );

    // Filing date
    const filedMatch = detailHtml.match(/Filing Date[^<]*<[^>]+>([^<]+)</) ||
                       detailHtml.match(/Date Filed[^<]*<[^>]+>([^<]+)</) ||
                       detailHtml.match(/(\d{2}\/\d{2}\/\d{4})/);
    const incDate = filedMatch ? filedMatch[1].trim() : null;

    // Status
    const statusMatch = detailHtml.match(/Active|Inactive|Dissolved/i);
    const companyStatus = statusMatch ? statusMatch[0] : null;

    // Officers — Sunbiz lists them in a table after "Officer/Director Detail"
    // The HTML structure is: <td>TITLE</td><td>NAME</td><td>ADDRESS</td>
    let officerName = null, officerType = 'unknown';
    const officerSection = detailHtml.split(/Officer\/Director Detail|OFFICER\/DIRECTOR DETAIL/i)[1] || '';
    if (officerSection) {
      // Extract all <td> contents in the officer section
      const tdMatches = [...officerSection.matchAll(/<td[^>]*>\s*([^<]{1,60})\s*<\/td>/gi)];
      const tdVals = tdMatches.map(m => m[1].replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').trim());
      // Sunbiz pattern: title row then name row. Titles are: P, VP, D, MGR, AMBR, RA, T, ST, etc.
      const TITLE_CODES = new Set(['P','VP','D','MGR','AMBR','RA','R','T','ST','CEO','CFO','COO','PRES','SEC','TREAS','DIR','MBR','AUTH REP']);
      const NON_NAME_WORDS = new Set(['OFFICER','DIRECTOR','MANAGER','MEMBER','PRESIDENT','SECRETARY','TREASURER',
        'REGISTERED','AGENT','FLORIDA','ACTIVE','INACTIVE','ADDRESS','TITLE','NAME','CITY','STATE','ZIP','DETAIL']);
      // Collect ALL officer candidates, then prefer real owner over commercial agent
      const officerCandidates = [];
      for (let i = 0; i < tdVals.length - 1; i++) {
        const val = tdVals[i].toUpperCase().replace(/[^A-Z0-9\s]/g,'').trim();
        if (TITLE_CODES.has(val)) {
          const candidate = tdVals[i + 1];
          if (candidate && !NON_NAME_WORDS.has(candidate.toUpperCase()) &&
              !/^\d/.test(candidate) && candidate.split(/\s+/).length >= 2 &&
              candidate.length > 4 && candidate.length < 55 &&
              !/ (LLC|INC|CORP|LTD|LP|LLP|PLLC|PA|PC)\.?$/i.test(candidate.trim())) {
            const isAgent = (val === 'RA' || val === 'R') || isKnownRAService(candidate);
            officerCandidates.push({ name: candidate.trim(), type: isAgent ? 'agent' : 'owner' });
          }
        }
      }
      // Prefer real person owner over commercial registered agent
      const bestOfficer = officerCandidates.find(c => c.type === 'owner') || officerCandidates[0] || null;
      if (bestOfficer) { officerName = bestOfficer.name; officerType = bestOfficer.type; }
      // Fallback: any ALL-CAPS word sequence 2-4 words that isn't a skip word
      if (!officerName) {
        const capsMatch = officerSection.match(/(?:^|>)\s*([A-Z]{2,}(?:\s+[A-Z]{2,}){1,3})\s*(?:<|$)/m);
        if (capsMatch && !NON_NAME_WORDS.has(capsMatch[1].trim()) && !isKnownRAService(capsMatch[1])) {
          officerName = capsMatch[1].trim();
        }
      }
    }

    console.log(`[SOS FL] "${bizName}" → officer=${officerName || 'NONE'} | date=${incDate || 'NONE'} | status=${companyStatus || 'NONE'}`);
    return {
      incorporationDate: incDate,
      businessAge: parseAge(incDate),
      companyStatus,
      officerName,
    };
  } catch(e) { console.log(`[SOS FL] FAILED for "${bizName}":`, e.message); return null; }
}

// ─── HELPERS ─────────────────────────────────────────────────────
function googleGet(path) {
  return new Promise((resolve, reject) => {
    https.get(`https://maps.googleapis.com${path}`, (r) => {
      let data = "";
      r.on("data", c => data += c);
      r.on("end", () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
    }).on("error", reject);
  });
}

async function fetchURL(url, timeoutMs = 8000, maxBytes = 500000, redirectCount = 0) {
  if (redirectCount > 5) throw new Error('Too many redirects');
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/json,*/*',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    };
    const req = proto.request(options, (res) => {
      // Follow redirects properly
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.resume(); // drain
        const nextUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : `${parsedUrl.protocol}//${parsedUrl.hostname}${res.headers.location}`;
        resolve(fetchURL(nextUrl, timeoutMs, maxBytes, redirectCount + 1));
        return;
      }
      if (res.statusCode === 403 || res.statusCode === 429 || res.statusCode === 503) {
        res.resume();
        // For email scraping, return empty string instead of rejecting so we can try other pages
        resolve('');
        return;
      }
      let data = '';
      res.on('data', c => { data += c; if (maxBytes > 0 && data.length > maxBytes) res.destroy(); });
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => { req.destroy(); reject(new Error('fetchURL timeout')); });
    req.end();
  });
}

function enc(s) { return encodeURIComponent(s); }

// ─── BRUTE FORCE PROTECTION ─────────────────────────────────────
// In-memory store: key = "email:ip" → { count, lockedUntil }
const loginAttempts = new Map();
function checkBruteForce(email, ip) {
  const key = `${(email||'').toLowerCase().trim()}:${ip}`;
  const entry = loginAttempts.get(key);
  if (!entry) return { blocked: false };
  if (entry.lockedUntil && Date.now() < entry.lockedUntil) {
    const mins = Math.ceil((entry.lockedUntil - Date.now()) / 60000);
    return { blocked: true, message: `Too many failed attempts. Try again in ${mins} minute${mins===1?'':'s'}.` };
  }
  return { blocked: false };
}
function recordFailedLogin(email, ip) {
  const key = `${(email||'').toLowerCase().trim()}:${ip}`;
  const entry = loginAttempts.get(key) || { count: 0, lockedUntil: null };
  entry.count++;
  if (entry.count >= 10) {
    entry.lockedUntil = Date.now() + 15 * 60 * 1000; // lock 15 minutes
    entry.count = 0; // reset after locking
    console.warn(`[SECURITY] Login locked for ${key} after 10 failed attempts`);
  }
  loginAttempts.set(key, entry);
  // Auto-clean old entries every 100 failures
  if (loginAttempts.size > 1000) {
    const now = Date.now();
    for (const [k, v] of loginAttempts.entries()) {
      if (!v.lockedUntil || v.lockedUntil < now) loginAttempts.delete(k);
    }
  }
}
function clearLoginAttempts(email, ip) {
  loginAttempts.delete(`${(email||'').toLowerCase().trim()}:${ip}`);
}

server.listen(PORT, () => console.log(`RCN Lead Gen API running on port ${PORT}`));
