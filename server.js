const https = require("https");
const http = require("http");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const PORT = process.env.PORT || 3000;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const POSTGRES_URL = process.env.POSTGRES_URL;
const JWT_SECRET = process.env.JWT_SECRET || "rcn-lead-gen-secret-change-in-prod";

const SBA_CSV_URL = "https://data.sba.gov/dataset/0ff8e8e9-b967-4f4e-987c-6ac78c575087/resource/d67d3ccb-2002-4134-a288-481b51cd3479/download/foia-7a-fy2020-present-as-of-251231.csv";

const PLAN_LIMITS = {
  pro: 1000,
  agency: 2400,
  unlimited: Infinity,
  admin: Infinity,
};

// ─── SBA IN-MEMORY CACHE ────────────────────────────────────────
let sbaIndex = null;
let sbaLoading = false;
let sbaLoadError = null;

function normalizeName(name) {
  return name.toLowerCase()
    .replace(/\b(llc|inc|corp|co|ltd|dba|the|and|&)\b/g, "")
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

async function loadSBAData() {
  if (sbaIndex || sbaLoading) return;
  sbaLoading = true;
  console.log("📊 Loading SBA data from government URL...");
  try {
    const csvText = await fetchURL(SBA_CSV_URL);
    const lines = csvText.split("\n");
    const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, "").trim());
    const idx = {
      name:   headers.findIndex(h => /BorrowerName/i.test(h)),
      city:   headers.findIndex(h => /BorrowerCity/i.test(h)),
      state:  headers.findIndex(h => /BorrowerState/i.test(h)),
      naics:  headers.findIndex(h => /NaicsCode/i.test(h)),
      amount: headers.findIndex(h => /GrossApproval/i.test(h)),
      date:   headers.findIndex(h => /ApprovalDate/i.test(h)),
      lender: headers.findIndex(h => /BankName/i.test(h)),
      jobs:   headers.findIndex(h => /JobsSupported/i.test(h)),
    };
    const index = {};
    let count = 0;
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const cols = parseCSVLine(lines[i]);
      const name = (cols[idx.name] || "").replace(/"/g, "").trim();
      if (!name) continue;
      const amount = parseFloat((cols[idx.amount] || "0").replace(/[^0-9.]/g, "")) || 0;
      if (amount < 10000) continue;
      const key = normalizeName(name);
      if (!key) continue;
      const record = {
        name,
        city:   (cols[idx.city]   || "").replace(/"/g, "").trim(),
        state:  (cols[idx.state]  || "").replace(/"/g, "").trim().toUpperCase(),
        naics:  (cols[idx.naics]  || "").replace(/"/g, "").trim(),
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
    sbaIndex = index;
    sbaLoading = false;
    console.log(`✅ SBA data loaded — ${count} records indexed`);
  } catch(err) {
    sbaLoadError = err.message;
    sbaLoading = false;
    console.error("❌ SBA load failed:", err.message);
  }
}

function lookupSBA(businessName, state) {
  if (!sbaIndex) return null;
  const key = normalizeName(businessName);
  if (!key) return null;
  let matches = sbaIndex[key] || [];
  if (matches.length === 0) {
    const words = key.split(" ").filter(w => w.length > 3);
    if (words.length > 0) {
      for (const [k, records] of Object.entries(sbaIndex)) {
        if (words.every(w => k.includes(w))) {
          matches = [...matches, ...records];
          if (matches.length > 5) break;
        }
      }
    }
  }
  if (matches.length === 0) return null;
  const stateMatch = matches.find(r => r.state === state);
  return stateMatch || matches[0];
}

// ─── POSTGRES ────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      plan TEXT NOT NULL DEFAULT 'pro',
      searches_used INTEGER NOT NULL DEFAULT 0,
      searches_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
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
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === "/") {
    respond(res, 200, { status: "ok", service: "RCN Lead Gen API", sba_ready: !!sbaIndex, sba_loading: sbaLoading });
    return;
  }

  // REGISTER
  if (url.pathname === "/auth/register" && req.method === "POST") {
    const { email, password } = await getBody(req);
    if (!email || !password) { respond(res, 400, { error: "Email and password required" }); return; }
    if (password.length < 8) { respond(res, 400, { error: "Password must be at least 8 characters" }); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { respond(res, 400, { error: "Invalid email address" }); return; }
    try {
      const hash = await bcrypt.hash(password, 12);
      const result = await pool.query(
        "INSERT INTO users (email, password_hash, plan) VALUES ($1, $2, 'pro') RETURNING id, email, plan, searches_used",
        [email.toLowerCase().trim(), hash]
      );
      const user = result.rows[0];
      const limit = PLAN_LIMITS[user.plan];
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
      respond(res, 201, { token, user: { id: user.id, email: user.email, plan: user.plan, searches_used: 0, searches_remaining: limit, limit } });
    } catch(e) {
      if (e.code === "23505") { respond(res, 409, { error: "An account with this email already exists" }); }
      else { console.error(e); respond(res, 500, { error: "Registration failed" }); }
    }
    return;
  }

  // LOGIN
  if (url.pathname === "/auth/login" && req.method === "POST") {
    const { email, password } = await getBody(req);
    if (!email || !password) { respond(res, 400, { error: "Email and password required" }); return; }
    try {
      const result = await pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase().trim()]);
      const user = result.rows[0];
      if (!user) { respond(res, 401, { error: "Invalid email or password" }); return; }
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) { respond(res, 401, { error: "Invalid email or password" }); return; }
      const resetDate = new Date(user.searches_reset_date);
      const now = new Date();
      if (now.getFullYear() > resetDate.getFullYear() || now.getMonth() > resetDate.getMonth()) {
        await pool.query("UPDATE users SET searches_used = 0, searches_reset_date = CURRENT_DATE WHERE id = $1", [user.id]);
        user.searches_used = 0;
      }
      const limit = PLAN_LIMITS[user.plan];
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
      respond(res, 200, {
        token,
        user: { id: user.id, email: user.email, plan: user.plan, searches_used: user.searches_used,
          searches_remaining: limit === Infinity ? null : limit - user.searches_used,
          limit: limit === Infinity ? null : limit }
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
      respond(res, 200, { user: { id: user.id, email: user.email, plan: user.plan, searches_used: user.searches_used,
        searches_remaining: limit === Infinity ? null : limit - user.searches_used,
        limit: limit === Infinity ? null : limit } });
    } catch(e) { console.error(e); respond(res, 500, { error: "Failed to get user" }); }
    return;
  }

  // SEARCH
  if (url.pathname === "/search") {
    const decoded = verifyToken(req);
    if (!decoded) { respond(res, 401, { error: "Unauthorized — please log in" }); return; }
    const type     = url.searchParams.get("type") || "";
    const location = url.searchParams.get("location") || "";
    const limit    = Math.min(parseInt(url.searchParams.get("limit") || "10"), 25);
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
      const placesData = await googleGet(`/maps/api/place/textsearch/json?query=${enc(type)}&location=${lat},${lng}&radius=30000&key=${GOOGLE_API_KEY}`);
      const places = (placesData.results || []).slice(0, limit);
      const actualCount = places.length;
      const detailed = await Promise.all(places.map(async (p) => {
        try {
          const d = await googleGet(`/maps/api/place/details/json?place_id=${p.place_id}&fields=formatted_phone_number,website,formatted_address&key=${GOOGLE_API_KEY}`);
          return { businessName: p.name, address: d.result?.formatted_address || p.formatted_address || "", phone: d.result?.formatted_phone_number || null, website: d.result?.website || null, placeId: p.place_id, rating: p.rating || null };
        } catch(_) {
          return { businessName: p.name, address: p.formatted_address || "", phone: null, website: null, placeId: p.place_id, rating: p.rating || null };
        }
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
    const placeId     = url.searchParams.get("placeId");
    const websiteHint = url.searchParams.get("website") || "";
    const bizName     = url.searchParams.get("name") || "";
    const bizState    = url.searchParams.get("state") || "";
    if (!placeId) { respond(res, 400, { error: "placeId required" }); return; }
    try {
      const d = await googleGet(`/maps/api/place/details/json?place_id=${placeId}&fields=formatted_phone_number,website,formatted_address&key=${GOOGLE_API_KEY}`);
      const phone   = d.result?.formatted_phone_number || null;
      const siteUrl = d.result?.website || websiteHint || null;
      const address = d.result?.formatted_address || null;
      let email = null;
      if (siteUrl) {
        email = await Promise.race([
          scrapeEmail(siteUrl),
          new Promise(r => setTimeout(() => r(null), 4000))
        ]);
      }
      const sosUrl = buildSOSUrl(bizName, bizState);
      respond(res, 200, { phone, website: siteUrl, address, email, sosUrl });
    } catch(err) { console.error(err); respond(res, 500, { error: err.message }); }
    return;
  }

  // SBA LOOKUP — match business name against loaded SBA data
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

  respond(res, 404, { error: "Not found" });
});

// ─── SOS URLS ────────────────────────────────────────────────────
function buildSOSUrl(bizName, state) {
  const name = encodeURIComponent(bizName);
  const urls = {
    FL: `https://search.sunbiz.org/Inquiry/CorporationSearch/SearchResults?inquirytype=EntityName&search=${name}`,
    TX: `https://mycpa.cpa.state.tx.us/coa/Index.html#search/${name}`,
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

// ─── EMAIL SCRAPER ───────────────────────────────────────────────
function fetchPageEmails(hostname, path, proto) {
  return new Promise((resolve) => {
    try {
      const options = {
        hostname, path, method: "GET", timeout: 3000,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; RCNBot/1.0)", "Accept": "text/html" }
      };
      const req = proto.request(options, (res) => {
        if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
          try {
            const loc = new URL(res.headers.location, `https://${hostname}`);
            resolve(fetchPageEmails(loc.hostname, loc.pathname + (loc.search || ""), loc.protocol === "https:" ? https : http));
          } catch(_) { resolve([]); }
          return;
        }
        let data = "";
        res.on("data", c => { data += c; if (data.length > 80000) res.destroy(); });
        res.on("end", () => {
          const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
          const matches = data.match(emailRegex) || [];
          const filtered = matches.filter(e =>
            !e.includes("example") && !e.includes("sentry") && !e.includes("wix") &&
            !e.includes("wordpress") && !e.includes("schema") && !e.includes("@2x") &&
            !e.endsWith(".png") && !e.endsWith(".jpg") && !e.endsWith(".gif") &&
            !e.includes("jquery") && !e.includes("bootstrap") && e.length < 60
          );
          resolve([...new Set(filtered)]);
        });
      });
      req.on("error", () => resolve([]));
      req.on("timeout", () => { req.destroy(); resolve([]); });
      req.end();
    } catch(_) { resolve([]); }
  });
}

async function scrapeEmail(siteUrl) {
  try {
    const urlObj = new URL(siteUrl);
    const proto = urlObj.protocol === "https:" ? https : http;
    const host = urlObj.hostname;
    // Check homepage + /contact in parallel for speed
    const [homeEmails, contactEmails] = await Promise.all([
      fetchPageEmails(host, "/", proto),
      fetchPageEmails(host, "/contact", proto),
    ]);
    const all = [...homeEmails, ...contactEmails];
    // Prefer a real business email over generic ones
    const preferred = all.find(e =>
      !e.startsWith("noreply") && !e.startsWith("no-reply") &&
      !e.startsWith("admin") && !e.startsWith("support") && !e.startsWith("info")
    );
    return preferred || all[0] || null;
  } catch(_) { return null; }
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

function fetchURL(url) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith("https") ? https : http;
    proto.get(url, (res) => {
      // handle redirects
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        resolve(fetchURL(res.headers.location));
        return;
      }
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => resolve(data));
      res.on("error", reject);
    }).on("error", reject);
  });
}

function enc(s) { return encodeURIComponent(s); }

server.listen(PORT, () => console.log(`RCN Lead Gen API running on port ${PORT}`));
