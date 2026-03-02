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
  agency: 2000,
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

function generateReferralCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function initDB() {
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
    "Access-Control-Allow-Origin": "*",
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
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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

  // ── ONE-TIME SETUP ENDPOINT — deletes itself after use ──────────
  if (url.pathname === '/setup-admin-rcn2024' && req.method === 'GET') {
    try {
      await pool.query(
        "UPDATE users SET is_admin = TRUE, plan = 'unlimited' WHERE email IN ('support@thercngroup.com', 'ivanrcngroup@gmail.com')"
      );
      respond(res, 200, { success: true, message: 'Both accounts upgraded to admin + unlimited.' });
    } catch(e) { respond(res, 500, { error: e.message }); }
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
