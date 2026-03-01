const https = require("https");
const http = require("http");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const PORT = process.env.PORT || 3000;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const POSTGRES_URL = process.env.POSTGRES_URL;
const JWT_SECRET = process.env.JWT_SECRET || "rcn-lead-gen-secret-change-in-prod";

const PLAN_LIMITS = {
  pro: 1000,
  agency: 2400,
  unlimited: Infinity,
  admin: Infinity,
};

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

async function getUser(userId) {
  const res = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
  const user = res.rows[0];
  if (!user) return null;
  const resetDate = new Date(user.searches_reset_date);
  const now = new Date();
  if (now.getFullYear() > resetDate.getFullYear() || now.getMonth() > resetDate.getMonth()) {
    await pool.query(
      "UPDATE users SET searches_used = 0, searches_reset_date = CURRENT_DATE WHERE id = $1",
      [userId]
    );
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
    respond(res, 200, { status: "ok", service: "RCN Lead Gen API" });
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
      respond(res, 201, {
        token,
        user: { id: user.id, email: user.email, plan: user.plan, searches_used: 0, searches_remaining: limit, limit }
      });
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
        user: {
          id: user.id, email: user.email, plan: user.plan,
          searches_used: user.searches_used,
          searches_remaining: limit === Infinity ? null : limit - user.searches_used,
          limit: limit === Infinity ? null : limit,
        }
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
      respond(res, 200, {
        user: {
          id: user.id, email: user.email, plan: user.plan,
          searches_used: user.searches_used,
          searches_remaining: limit === Infinity ? null : limit - user.searches_used,
          limit: limit === Infinity ? null : limit,
        }
      });
    } catch(e) { console.error(e); respond(res, 500, { error: "Failed to get user" }); }
    return;
  }

  // SEARCH
  if (url.pathname === "/search") {
    const decoded = verifyToken(req);
    if (!decoded) { respond(res, 401, { error: "Unauthorized — please log in" }); return; }

    const type    = url.searchParams.get("type") || "";
    const location = url.searchParams.get("location") || "";
    const limit   = Math.min(parseInt(url.searchParams.get("limit") || "10"), 25);
    const details = url.searchParams.get("details") !== "false";

    try {
      const user = await getUser(decoded.userId);
      if (!user) { respond(res, 401, { error: "User not found" }); return; }

      const planLimit = PLAN_LIMITS[user.plan];
      if (planLimit !== Infinity && user.searches_used + limit > planLimit) {
        const remaining = planLimit - user.searches_used;
        respond(res, 403, {
          error: `You only have ${remaining} searches left this month. Reduce your lead count or upgrade your plan.`,
          searches_used: user.searches_used,
          searches_remaining: remaining,
          limit: planLimit,
          plan: user.plan,
        });
        return;
      }

      const geoData = await googleGet(`/maps/api/geocode/json?address=${enc(location)}&key=${GOOGLE_API_KEY}`);
      if (!geoData.results?.[0]) { respond(res, 404, { error: "Location not found" }); return; }
      const { lat, lng } = geoData.results[0].geometry.location;

      const placesData = await googleGet(
        `/maps/api/place/textsearch/json?query=${enc(type)}&location=${lat},${lng}&radius=30000&key=${GOOGLE_API_KEY}`
      );
      const places = (placesData.results || []).slice(0, limit);
      const actualCount = places.length;

      let detailed;
      if (details) {
        detailed = await Promise.all(places.map(async (p) => {
          try {
            const d = await googleGet(`/maps/api/place/details/json?place_id=${p.place_id}&fields=formatted_phone_number,website,formatted_address&key=${GOOGLE_API_KEY}`);
            return { businessName: p.name, address: d.result?.formatted_address || p.formatted_address || "", phone: d.result?.formatted_phone_number || null, website: d.result?.website || null, placeId: p.place_id, rating: p.rating || null };
          } catch(_) {
            return { businessName: p.name, address: p.formatted_address || "", phone: null, website: null, placeId: p.place_id, rating: p.rating || null };
          }
        }));
      } else {
        detailed = places.map(p => ({ businessName: p.name, address: p.formatted_address || "", phone: null, website: null, placeId: p.place_id, rating: p.rating || null }));
      }

      await pool.query("UPDATE users SET searches_used = searches_used + $1 WHERE id = $2", [actualCount, user.id]);
      const newUsed = user.searches_used + actualCount;
      const remaining = planLimit === Infinity ? null : planLimit - newUsed;

      respond(res, 200, {
        results: detailed,
        searches_used: newUsed,
        searches_remaining: remaining,
        limit: planLimit === Infinity ? null : planLimit,
      });

    } catch(err) { console.error(err); respond(res, 500, { error: err.message }); }
    return;
  }

  respond(res, 404, { error: "Not found" });
});

function googleGet(path) {
  return new Promise((resolve, reject) => {
    https.get(`https://maps.googleapis.com${path}`, (r) => {
      let data = "";
      r.on("data", c => data += c);
      r.on("end", () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
    }).on("error", reject);
  });
}

function enc(s) { return encodeURIComponent(s); }

server.listen(PORT, () => console.log(`RCN Lead Gen API running on port ${PORT}`));
